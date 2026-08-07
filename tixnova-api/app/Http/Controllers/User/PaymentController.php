<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Jobs\SendEticket;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Voucher;
use App\Services\InventoryReservationService;
use App\Services\Payments\MidtransGateway;
use App\Services\Payments\StripeGateway;
use App\Services\Payments\XenditGateway;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(
        private MidtransGateway $midtrans,
        private XenditGateway $xendit,
        private StripeGateway $stripe,
        private InventoryReservationService $inventory,
        private ReferralService $referrals,
    ) {}

    public function initiate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_code' => ['required', 'string', 'exists:orders,order_code'],
        ]);

        $payment = DB::transaction(function () use ($request, $data) {
            $order = Order::withoutGlobalScopes()
                ->where('order_code', $data['order_code'])
                ->where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($order->status !== 'pending' || ! $order->expired_at || $order->expired_at->isPast()) {
                abort(422, 'Order ini sudah tidak dapat dibayar.');
            }

            if ((float) $order->total <= 0) {
                // Free order - auto complete
                $order->update(['status' => 'paid', 'paid_at' => now()]);
                $payment = Payment::where('order_id', $order->id)->latest()->firstOrFail();
                $payment->update(['status' => 'success', 'paid_at' => now()]);

                return response()->json([
                    'success' => true,
                    'data' => ['order_code' => $order->order_code, 'payment_url' => null],
                ]);
            }

            $payment = Payment::where('order_id', $order->id)->lockForUpdate()->latest()->firstOrFail();

            if ($payment->status !== 'pending') {
                abort(422, 'Pembayaran untuk order ini sudah tidak dapat diinisiasi.');
            }

            if ($payment->payment_url && ! $request->boolean('force_refresh')) {
                return $payment;
            }

            // Ensure fresh external_id for Midtrans Sandbox uniqueness
            if (! $payment->external_id || $request->boolean('force_refresh')) {
                $payment->update([
                    'external_id' => $order->order_code.'-'.strtoupper(str()->random(8)),
                ]);
            }

            $order->load(['items.ticket']);

            $response = match ($payment->provider) {
                'xendit' => $this->xendit->createInvoice($order, $payment),
                'stripe' => $this->stripe->createCheckoutSession($order, $payment),
                default => $this->midtrans->createTransaction($order, $payment),
            };

            $payment->update([
                'payment_url' => $response['redirect_url'] ?? ($response['invoice_url'] ?? ($response['url'] ?? null)),
                'payload_raw' => $this->safePayload($response),
            ]);

            return $payment->fresh();
        });

        if ($payment instanceof JsonResponse) {
            return $payment;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $data['order_code'],
                'payment_url' => $payment->payment_url,
                'expired_at' => $payment->expired_at?->toIso8601String(),
            ],
        ]);
    }

    private function safePayload(array $response): array
    {
        return [
            'token' => $response['token'] ?? null,
            'redirect_url' => $response['redirect_url'] ?? null,
            'invoice_url' => $response['invoice_url'] ?? null,
            'url' => $response['url'] ?? null,
            'id' => $response['id'] ?? null,
            'external_id' => $response['id'] ?? null,
            'status' => $response['status'] ?? null,
        ];
    }

    public function status(Request $request, string $orderCode): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->where('order_code', $orderCode)
            ->where('user_id', $request->user()->id)
            ->with('payment')
            ->firstOrFail();

        // Sync with provider status if order is pending
        if ($order->status === 'pending' && $order->payment) {
            $provider = $order->payment->provider;

            if ($provider === 'midtrans') {
                $statusData = $this->midtrans->getTransactionStatus($order->payment);
                if ($statusData) {
                    $trxStatus = $statusData['transaction_status'] ?? null;
                    $fraudStatus = $statusData['fraud_status'] ?? null;

                    if (in_array($trxStatus, ['settlement', 'capture'], true) && in_array($fraudStatus, ['accept', null, ''], true)) {
                        $this->settle($order, $statusData['transaction_id'] ?? null, $statusData['payment_type'] ?? null);
                    }
                }
            } elseif ($provider === 'stripe') {
                $statusData = $this->stripe->getCheckoutSessionStatus($order->payment);
                if ($statusData && ($statusData['status'] ?? '') === 'complete' && ($statusData['payment_status'] ?? '') === 'paid') {
                    $this->settle($order, $statusData['payment_intent'] ?? null, null);
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_code' => $order->order_code,
                'order_status' => $order->status,
                'expires_at' => $order->expired_at?->toIso8601String(),
                'community_code' => $order->community_code,
                'payment' => $order->payment ? [
                    'status' => $order->payment->status,
                    'paid_at' => $order->payment->paid_at?->toIso8601String(),
                ] : null,
            ],
        ]);
    }

    private function settle(Order $order, ?string $transactionId, ?string $paymentType): void
    {
        DB::transaction(function () use ($order, $transactionId, $paymentType) {
            $order->refresh();
            if ($order->status !== 'pending') {
                return;
            }

            $this->inventory->convertToSold($order);
            $order->payment->update([
                'status' => 'success',
                'paid_at' => now(),
                'provider_transaction_id' => $transactionId ?: $order->payment->provider_transaction_id,
                'provider_payment_type' => $paymentType ?: $order->payment->provider_payment_type,
            ]);
            $order->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $this->referrals->rewardPaidOrder($order);
            SendEticket::dispatch($order->id)->afterCommit();

            if ($order->voucher_id) {
                Voucher::withoutGlobalScopes()
                    ->whereKey($order->voucher_id)
                    ->lockForUpdate()
                    ->increment('used_count');
            }
        });

        $order->refresh();
    }
}

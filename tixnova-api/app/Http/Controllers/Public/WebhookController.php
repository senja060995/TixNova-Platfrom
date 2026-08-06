<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Jobs\SendEticket;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\Refund;
use App\Models\Voucher;
use App\Services\InventoryReservationService;
use App\Services\Payments\XenditGateway;
use App\Services\ReferralService;
use App\Services\RefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller
{
    public function __construct(
        private InventoryReservationService $inventory,
        private ReferralService $referrals,
    ) {}

    public function midtrans(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'string'],
            'status_code' => ['required', 'string'],
            'gross_amount' => ['required'],
            'signature_key' => ['required', 'string'],
            'transaction_status' => ['required', 'string'],
            'transaction_id' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string'],
            'fraud_status' => ['nullable', 'string'],
            'refund_key' => ['nullable', 'string'],
            'refund_chargeback_id' => ['nullable', 'string'],
        ]);

        $serverKey = config('services.midtrans.server_key');
        $signature = hash('sha512', $data['order_id'].$data['status_code'].$data['gross_amount'].$serverKey);

        if (blank($serverKey) || ! hash_equals($signature, $data['signature_key'])) {
            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        DB::transaction(function () use ($data) {
            $payment = Payment::where('provider', 'midtrans')
                ->where('external_id', $data['order_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (number_format((float) $payment->amount, 2, '.', '') !== number_format((float) $data['gross_amount'], 2, '.', '')) {
                abort(422, 'Payment amount mismatch.');
            }

            $eventKey = hash('sha256', implode('|', [
                $payment->id,
                $data['transaction_id'] ?? '',
                $data['refund_key'] ?? '',
                $data['refund_chargeback_id'] ?? '',
                $data['transaction_status'],
                $data['fraud_status'] ?? '',
            ]));

            if (PaymentWebhookEvent::where('event_key', $eventKey)->exists()) {
                return;
            }

            PaymentWebhookEvent::create([
                'payment_id' => $payment->id,
                'provider' => 'midtrans',
                'event_key' => $eventKey,
                'transaction_status' => $data['transaction_status'],
                'received_at' => now(),
            ]);

            $payment->update([
                'provider_transaction_id' => $data['transaction_id'] ?? $payment->provider_transaction_id,
                'provider_payment_type' => $data['payment_type'] ?? $payment->provider_payment_type,
            ]);

            $order = Order::withoutGlobalScopes()
                ->whereKey($payment->order_id)
                ->lockForUpdate()
                ->firstOrFail()
                ->load('items');

            $paymentStatus = $this->paymentStatus($data['transaction_status'], $data['fraud_status'] ?? null);

            if ($paymentStatus === 'refunded') {
                $refund = Refund::where('payment_id', $payment->id)
                    ->whereIn('status', ['processing', 'manual_required'])
                    ->lockForUpdate()
                    ->first();

                if ($refund) {
                    $refund->update([
                        'provider_refund_id' => $data['refund_key'] ?? $data['refund_chargeback_id'] ?? $refund->provider_refund_id,
                        'provider_response' => $this->safePayload($data),
                    ]);
                    app(RefundService::class)->confirm($refund);
                }

                return;
            }

            if ($payment->status === 'success' || $order->status === 'paid') {
                return;
            }

            if ($paymentStatus === 'success') {
                if ($order->status !== 'pending' || ! $order->expired_at || $order->expired_at->isPast()) {
                    return;
                }

                $this->inventory->convertToSold($order);
                $payment->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'payload_raw' => $this->safePayload($data),
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

                return;
            }

            if ($order->status !== 'pending') {
                return;
            }

            if (in_array($paymentStatus, ['failed', 'expired'], true)) {
                $this->inventory->release($order);
                $payment->update([
                    'status' => $paymentStatus,
                    'payload_raw' => $this->safePayload($data),
                ]);
                $order->update([
                    'status' => $paymentStatus === 'expired' ? 'expired' : 'cancelled',
                    'cancelled_at' => $paymentStatus === 'failed' ? now() : null,
                ]);
            }
        });

        return response()->json(['status' => 'OK']);
    }

    public function xendit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string'],
            'external_id' => ['required', 'string'],
            'status' => ['required', 'string'],
            'amount' => ['required', 'numeric'],
            'paid_at' => ['nullable', 'string'],
            'payment_method' => ['nullable', 'string'],
            'payment_channel' => ['nullable', 'string'],
        ]);

        $callbackToken = config('services.xendit.callback_token');
        $requestToken = $request->header('x-callback-token');

        if (blank($callbackToken) || blank($requestToken) || ! hash_equals($callbackToken, $requestToken)) {
            return response()->json(['message' => 'Invalid callback token.'], 403);
        }

        $callback = app(XenditGateway::class)->handleCallback($data);

        DB::transaction(function () use ($data, $callback) {
            $payment = Payment::where('provider', 'xendit')
                ->where('external_id', $callback['external_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (number_format((float) $payment->amount, 2, '.', '') !== number_format((float) $callback['amount'], 2, '.', '')) {
                abort(422, 'Payment amount mismatch.');
            }

            $eventKey = hash('sha256', implode('|', [
                $payment->id,
                $data['id'],
                $data['status'],
                $data['paid_at'] ?? '',
            ]));

            if (PaymentWebhookEvent::where('event_key', $eventKey)->exists()) {
                return;
            }

            PaymentWebhookEvent::create([
                'payment_id' => $payment->id,
                'provider' => 'xendit',
                'event_key' => $eventKey,
                'transaction_status' => $data['status'],
                'received_at' => now(),
            ]);

            $payment->update([
                'provider_transaction_id' => $data['id'],
                'provider_payment_type' => $callback['payment_method'],
            ]);

            $order = Order::withoutGlobalScopes()
                ->whereKey($payment->order_id)
                ->lockForUpdate()
                ->firstOrFail()
                ->load('items');

            if ($payment->status === 'success' || $order->status === 'paid') {
                return;
            }

            if ($callback['status'] === 'success') {
                if ($order->status !== 'pending' || ! $order->expired_at || $order->expired_at->isPast()) {
                    return;
                }

                $this->inventory->convertToSold($order);
                $payment->update([
                    'status' => 'success',
                    'paid_at' => now(),
                    'payload_raw' => $this->safeXenditPayload($data),
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

                return;
            }

            if ($order->status !== 'pending') {
                return;
            }

            if (in_array($callback['status'], ['failed', 'expired'], true)) {
                $this->inventory->release($order);
                $payment->update([
                    'status' => $callback['status'],
                    'payload_raw' => $this->safeXenditPayload($data),
                ]);
                $order->update([
                    'status' => $callback['status'] === 'expired' ? 'expired' : 'cancelled',
                    'cancelled_at' => $callback['status'] === 'failed' ? now() : null,
                ]);
            }
        });

        return response()->json(['status' => 'OK']);
    }

    private function paymentStatus(string $transactionStatus, ?string $fraudStatus): string
    {
        return match ($transactionStatus) {
            'capture' => $fraudStatus === 'challenge' ? 'pending' : 'success',
            'settlement' => 'success',
            'expire' => 'expired',
            'refund', 'partial_refund' => 'refunded',
            'cancel', 'deny' => 'failed',
            default => 'pending',
        };
    }

    private function safeXenditPayload(array $data): array
    {
        return [
            'id' => $data['id'],
            'external_id' => $data['external_id'],
            'status' => $data['status'],
            'amount' => $data['amount'],
            'paid_at' => $data['paid_at'] ?? null,
            'payment_method' => $data['payment_method'] ?? null,
            'payment_channel' => $data['payment_channel'] ?? null,
        ];
    }

    private function safePayload(array $data): array
    {
        return [
            'order_id' => $data['order_id'],
            'transaction_id' => $data['transaction_id'] ?? null,
            'payment_type' => $data['payment_type'] ?? null,
            'refund_key' => $data['refund_key'] ?? null,
            'refund_chargeback_id' => $data['refund_chargeback_id'] ?? null,
            'transaction_status' => $data['transaction_status'],
            'fraud_status' => $data['fraud_status'] ?? null,
            'gross_amount' => $data['gross_amount'],
            'status_code' => $data['status_code'],
        ];
    }
}

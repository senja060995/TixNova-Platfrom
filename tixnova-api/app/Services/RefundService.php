<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use App\Models\User;
use App\Services\Payments\MidtransGateway;
use App\Services\Payments\StripeGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RefundService
{
    public function __construct(
        private InventoryReservationService $inventory,
        private ReferralService $referrals,
        private MidtransGateway $midtrans,
        private StripeGateway $stripe,
    ) {}

    public function request(Order $order, User $buyer, array $data): Refund
    {
        return DB::transaction(function () use ($order, $buyer, $data) {
            $order = Order::withoutGlobalScopes()
                ->with(['event', 'items', 'payment', 'refund'])
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertRequestEligible($order, $buyer);

            $payment = $order->payment;
            $amount = max(0, (float) $order->subtotal - (float) $order->discount);

            return Refund::create([
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'requested_by' => $buyer->id,
                'status' => $order->event->status === 'cancelled' ? 'approved' : 'requested',
                'reason' => $data['reason'],
                'amount' => $amount,
                'bank_name' => $data['bank_name'] ?? null,
                'bank_account_name' => $data['bank_account_name'] ?? null,
                'bank_account_number' => $data['bank_account_number'] ?? null,
                'provider_refund_key' => 'RFD-'.strtoupper(str()->random(20)),
                'requested_at' => now(),
                'reviewed_at' => $order->event->status === 'cancelled' ? now() : null,
                'review_note' => $order->event->status === 'cancelled' ? 'Event dibatalkan; refund otomatis disetujui.' : null,
            ]);
        });
    }

    public function review(Refund $refund, User $promotor, bool $approved, ?string $note): Refund
    {
        return DB::transaction(function () use ($refund, $promotor, $approved, $note) {
            $refund = Refund::with('order.event')->whereKey($refund->id)->lockForUpdate()->firstOrFail();

            if ($refund->status !== 'requested') {
                throw ValidationException::withMessages(['refund' => 'Refund ini tidak dapat ditinjau.']);
            }

            if ($refund->order->tenant_id !== $promotor->tenant_id) {
                abort(404);
            }

            $refund->update([
                'status' => $approved ? 'approved' : 'rejected',
                'reviewed_by' => $promotor->id,
                'reviewed_at' => now(),
                'review_note' => $note,
            ]);

            return $refund->fresh();
        });
    }

    public function process(Refund $refund, User $admin): Refund
    {
        return DB::transaction(function () use ($refund, $admin) {
            $refund = Refund::with(['payment', 'order'])->whereKey($refund->id)->lockForUpdate()->firstOrFail();

            if ($refund->status !== 'approved') {
                throw ValidationException::withMessages(['refund' => 'Refund harus disetujui promotor sebelum diproses.']);
            }

            $refund->update([
                'status' => $this->supportsAutomaticRefund($refund->payment) ? 'processing' : 'manual_required',
                'processed_by' => $admin->id,
                'processed_at' => now(),
            ]);

            if ($refund->status === 'manual_required') {
                return $refund->fresh();
            }

            $response = match ($refund->payment->provider) {
                'stripe' => $this->stripe->refund($refund->payment, $refund),
                default => $this->midtrans->refund($refund->payment, $refund),
            };
            $refund->update([
                'provider_refund_id' => $response['refund_key'] ?? $response['refund_id'] ?? $refund->provider_refund_key,
                'provider_response' => $this->safeProviderResponse($response),
            ]);

            return $refund->fresh();
        });
    }

    public function confirm(Refund $refund): void
    {
        DB::transaction(function () use ($refund) {
            $refund = Refund::with(['order.event', 'payment'])->whereKey($refund->id)->lockForUpdate()->firstOrFail();

            if ($refund->status === 'refunded') {
                return;
            }

            $order = Order::withoutGlobalScopes()->whereKey($refund->order_id)->lockForUpdate()->firstOrFail()->load('items');

            if ($order->status !== 'paid') {
                throw new \RuntimeException('Status order tidak valid untuk refund.');
            }

            if ($order->event->status === 'approved' && $order->event->start_date->isFuture()) {
                $this->inventory->returnToInventory($order);
            }

            $order->update(['status' => 'refunded']);
            $refund->payment->update([
                'status' => 'refunded',
                'refund_amount' => $refund->amount,
                'refund_at' => now(),
                'refund_reason' => $refund->reason,
            ]);
            $refund->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);
            $this->referrals->reverseReward($order);
        });
    }

    private function assertRequestEligible(Order $order, User $buyer): void
    {
        if ($order->user_id !== $buyer->id || $order->status !== 'paid' || ! $order->payment || $order->payment->status !== 'success') {
            throw ValidationException::withMessages(['order' => 'Order ini tidak memenuhi syarat refund.']);
        }

        if ($order->refund || $order->items->contains(fn ($item) => $item->qr_used)) {
            throw ValidationException::withMessages(['order' => 'Order ini sudah memiliki refund atau tiket telah digunakan.']);
        }

        if ($order->event->status !== 'cancelled' && now()->gt($order->event->start_date->copy()->subDays(7))) {
            throw ValidationException::withMessages(['order' => 'Refund hanya dapat diajukan sampai 7 hari sebelum event.']);
        }
    }

    private function supportsAutomaticRefund(Payment $payment): bool
    {
        if ($payment->provider === 'stripe') {
            return filled($payment->provider_transaction_id);
        }

        return $payment->provider === 'midtrans'
            && filled($payment->provider_transaction_id)
            && in_array($payment->provider_payment_type, config('services.midtrans.automatic_refund_payment_types'), true);
    }

    private function safeProviderResponse(array $response): array
    {
        return collect($response)->only(['status_code', 'status_message', 'refund_key', 'refund_chargeback_id'])->all();
    }
}

<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private InventoryReservationService $inventory,
        private ReferralService $referrals,
        private SeatReservationService $seats,
        private CommunityService $community,
    ) {}

    public function create(User $user, array $data): Order
    {
        return DB::transaction(function () use ($user, $data) {
            $event = Event::withoutGlobalScope('tenant')
                ->whereKey($data['event_id'])
                ->where('status', 'approved')
                ->where('start_date', '>', now())
                ->first();

            if (! $event) {
                throw ValidationException::withMessages([
                    'event_id' => 'Event tidak tersedia untuk pembelian.',
                ]);
            }

            $items = collect($data['items'])
                ->groupBy('ticket_id')
                ->map(function ($items, $ticketId) {
                    return [
                        'ticket_id' => (int) $ticketId,
                        'quantity' => (int) $items->sum('quantity'),
                        'attendees' => $items->flatMap(fn ($item) => $item['attendees'] ?? [])->values()->all(),
                        'seat_ids' => $items->flatMap(fn ($item) => $item['seat_ids'] ?? [])->map(fn ($seatId) => (int) $seatId)->values()->all(),
                    ];
                })
                ->values();

            $tickets = Ticket::where('event_id', $event->id)
                ->whereIn('id', $items->pluck('ticket_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($tickets->count() !== $items->count()) {
                throw ValidationException::withMessages([
                    'items' => 'Tiket tidak valid untuk event ini.',
                ]);
            }

            $seatMap = $event->seatMap()
                ->where('is_published', true)
                ->lockForUpdate()
                ->first();
            $seatsByTicket = [];

            if ($seatMap) {
                $seatsById = $seatMap->seats()
                    ->whereIn('ticket_id', $items->pluck('ticket_id'))
                    ->get()
                    ->keyBy('id');
                $seatedTicketIds = $seatsById
                    ->pluck('ticket_id')
                    ->unique()
                    ->all();

                foreach ($items as $item) {
                    $requiresSeat = in_array($item['ticket_id'], $seatedTicketIds, true);

                    if ($requiresSeat && count($item['seat_ids']) !== $item['quantity']) {
                        throw ValidationException::withMessages(['items' => 'Jumlah kursi harus sama dengan jumlah tiket seated.']);
                    }

                    if (! $requiresSeat && $item['seat_ids']) {
                        throw ValidationException::withMessages(['items' => 'Kursi hanya dapat dipilih untuk tier seated.']);
                    }

                    if ($item['seat_ids']) {
                        $seatsByTicket[$item['ticket_id']] = $item['seat_ids'];
                    }
                }
            } elseif ($items->contains(fn ($item) => $item['seat_ids'])) {
                throw ValidationException::withMessages(['items' => 'Event ini belum memiliki seat map.']);
            }

            $subtotal = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $ticket = $tickets->get($item['ticket_id']);
                $quantity = $item['quantity'];

                if (! $ticket->is_active
                    || ($ticket->sale_start && now()->lt($ticket->sale_start))
                    || ($ticket->sale_end && now()->gt($ticket->sale_end))) {
                    throw ValidationException::withMessages([
                        'items' => "Penjualan tiket {$ticket->name} tidak aktif.",
                    ]);
                }

                if ($quantity < $ticket->min_purchase || $quantity > $ticket->max_purchase) {
                    throw ValidationException::withMessages([
                        'items' => "Jumlah pembelian tiket {$ticket->name} harus antara {$ticket->min_purchase} dan {$ticket->max_purchase}.",
                    ]);
                }

                if (($ticket->quota - $ticket->sold - $ticket->reserved) < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Kuota tiket {$ticket->name} tidak mencukupi.",
                    ]);
                }

                $subtotal += $ticket->currentPrice() * $quantity;
                $attendees = $item['attendees'];

                for ($index = 0; $index < $quantity; $index++) {
                    $attendee = $attendees[$index] ?? [];
                    $orderItems[] = [
                        'ticket_id' => $ticket->id,
                        'seat_id' => $item['seat_ids'][$index] ?? null,
                        'seat_number' => isset($item['seat_ids'][$index])
                            ? $seatsById->get($item['seat_ids'][$index])?->label
                            : null,
                        'quantity' => 1,
                        'price' => $ticket->currentPrice(),
                        'attendee_name' => Arr::get($attendee, 'name', $data['buyer_name']),
                        'attendee_email' => Arr::get($attendee, 'email', $data['buyer_email']),
                        'attendee_phone' => Arr::get($attendee, 'phone', $data['buyer_phone']),
                        'qr_code' => 'QR-'.strtoupper(str()->random(24)),
                    ];
                }

                $ticket->reserved += $quantity;
                $ticket->save();
            }

            [$voucher, $discount] = $this->resolveVoucher($data['voucher_code'] ?? null, $event, $subtotal);
            $referral = $this->referrals->attach($data['referral_code'] ?? null, $user);
            $community = $this->community->attach($data['community_code'] ?? null, $user);
            $tenant = Tenant::findOrFail($event->tenant_id);
            $adminFee = $subtotal > 0 ? $this->adminFee($tenant) : 0;
            $total = max(0, $subtotal + $adminFee - $discount);
            $commissionFee = $this->commission($subtotal, $tenant);
            $expiredAt = now()->addMinutes(15);

            $order = Order::withoutGlobalScopes()->create([
                'user_id' => $user->id,
                'event_id' => $event->id,
                'tenant_id' => $event->tenant_id,
                'voucher_id' => $voucher?->id,
                'referral_code' => $referral?->code,
                'community_code' => $community?->code,
                'source' => $data['source'] ?? null,
                'subtotal' => $subtotal,
                'admin_fee' => $adminFee,
                'discount' => $discount,
                'commission_fee' => $commissionFee,
                'total' => $total,
                'status' => 'pending',
                'buyer_name' => $data['buyer_name'],
                'buyer_email' => $data['buyer_email'],
                'buyer_phone' => $data['buyer_phone'],
                'expired_at' => $expiredAt,
            ]);

            $order->items()->createMany($orderItems);

            if ($seatsByTicket) {
                $this->seats->hold($seatMap, $order, $seatsByTicket);
            }

            Payment::create([
                'order_id' => $order->id,
                'method' => $data['payment_method'],
                'provider' => $data['payment_method'] === 'stripe' ? 'stripe' : 'midtrans',
                'external_id' => $order->order_code.'-'.strtoupper(str()->random(8)),
                'amount' => $total,
                'status' => 'pending',
                'expired_at' => $expiredAt,
            ]);

            return $order->load(['event', 'items.ticket', 'items.seat', 'payment']);
        });
    }

    private function commission(float $subtotal, Tenant $tenant): float
    {
        $rate = (float) ($tenant->commission ?? config('commission.default'));
        $commission = $subtotal * ($rate / 100);

        return min(
            (float) config('commission.maximum_amount'),
            max((float) config('commission.minimum_amount'), $commission)
        );
    }

    private function adminFee(Tenant $tenant): float
    {
        $override = data_get($tenant->settings, 'admin_fee');

        if (is_numeric($override)) {
            return (float) $override;
        }

        return (float) config('commission.admin_fee', 5000);
    }

    private function resolveVoucher(?string $code, Event $event, float $subtotal): array
    {
        if (blank($code)) {
            return [null, 0];
        }

        $voucher = Voucher::withoutGlobalScope('tenant')
            ->where('code', strtoupper(trim($code)))
            ->lockForUpdate()
            ->first();

        if (! $voucher || ! $voucher->isValid() || $voucher->tenant_id !== $event->tenant_id
            || ($voucher->event_id && $voucher->event_id !== $event->id)
            || $subtotal < (float) $voucher->min_purchase) {
            throw ValidationException::withMessages([
                'voucher_code' => 'Voucher tidak dapat digunakan untuk pembelian ini.',
            ]);
        }

        return [$voucher, $voucher->calculateDiscount($subtotal)];
    }
}

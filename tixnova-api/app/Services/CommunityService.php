<?php

namespace App\Services;

use App\Models\Community;
use App\Models\CommunityEvent;
use App\Models\CommunityMember;
use App\Models\CommunityPayout;
use App\Models\Event;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CommunityService
{
    public function attach(?string $code, User $buyer): ?Community
    {
        if (blank($code)) {
            return null;
        }

        $code = strtoupper(trim($code));

        $community = Community::withoutGlobalScopes()
            ->where('code', $code)
            ->where('status', 'active')
            ->first();

        if (! $community) {
            throw ValidationException::withMessages([
                'community_code' => 'Kode komunitas tidak valid.',
            ]);
        }

        return $community;
    }

    public function recordPaidOrder(Order $order): void
    {
        if (blank($order->community_code)) {
            return;
        }

        DB::transaction(function () use ($order) {
            if (CommunityPayout::where('order_id', $order->id)->exists()) {
                return;
            }

            $community = Community::withoutGlobalScopes()
                ->where('code', $order->community_code)
                ->where('status', 'active')
                ->first();

            if (! $community) {
                return;
            }

            $ce = CommunityEvent::where('community_id', $community->id)
                ->where('event_id', $order->event_id)
                ->first();

            if (! $ce) {
                return;
            }

            $amount = round((float) $order->subtotal * ((float) $ce->revenue_share_pct / 100), 2);

            CommunityPayout::create([
                'tenant_id' => $order->tenant_id,
                'community_id' => $community->id,
                'order_id' => $order->id,
                'event_id' => $order->event_id,
                'share_pct' => $ce->revenue_share_pct,
                'amount' => $amount,
                'status' => 'earned',
                'earned_at' => now(),
            ]);

            $this->autoJoin($community, $order->user_id);
        });
    }

    public function reversePayout(Order $order): void
    {
        if (blank($order->community_code)) {
            return;
        }

        DB::transaction(function () use ($order) {
            $payout = CommunityPayout::where('order_id', $order->id)
                ->where('status', 'earned')
                ->lockForUpdate()
                ->first();

            if (! $payout) {
                return;
            }

            $payout->forceFill([
                'status' => 'reversed',
                'reversed_at' => now(),
            ])->save();
        });
    }

    public function join(Community $community, int $userId, string $role = 'member'): CommunityMember
    {
        return CommunityMember::updateOrCreate(
            ['community_id' => $community->id, 'user_id' => $userId],
            ['role' => $role, 'joined_at' => now()],
        );
    }

    public function leave(Community $community, int $userId): bool
    {
        return CommunityMember::where('community_id', $community->id)
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    public function attachEvent(Community $community, int $eventId, float $sharePct): CommunityEvent
    {
        if ($sharePct < 0 || $sharePct > 100) {
            throw ValidationException::withMessages([
                'revenue_share_pct' => 'Persentase share harus antara 0–100.',
            ]);
        }

        $event = Event::withoutGlobalScopes()->find($eventId);
        if (! $event) {
            throw ValidationException::withMessages(['event_id' => 'Event tidak ditemukan.']);
        }

        return CommunityEvent::updateOrCreate(
            ['community_id' => $community->id, 'event_id' => $eventId],
            ['revenue_share_pct' => $sharePct],
        );
    }

    public function updateEventShare(CommunityEvent $ce, float $sharePct): CommunityEvent
    {
        if ($sharePct < 0 || $sharePct > 100) {
            throw ValidationException::withMessages([
                'revenue_share_pct' => 'Persentase share harus antara 0–100.',
            ]);
        }

        $ce->update(['revenue_share_pct' => $sharePct]);

        return $ce->fresh();
    }

    public function detachEvent(CommunityEvent $ce): void
    {
        $ce->delete();
    }

    public function summary(Community $community): array
    {
        return [
            'member_count' => $community->members()->count(),
            'events_count' => $community->events()->count(),
            'total_share_earned' => (float) $community->payouts()->where('status', 'earned')->sum('amount'),
            'total_share_reversed' => (float) $community->payouts()->where('status', 'reversed')->sum('amount'),
            'orders_count' => $community->payouts()->count(),
        ];
    }

    private function autoJoin(Community $community, int $userId): void
    {
        CommunityMember::firstOrCreate(
            ['community_id' => $community->id, 'user_id' => $userId],
            ['role' => 'member', 'joined_at' => now()],
        );
    }
}

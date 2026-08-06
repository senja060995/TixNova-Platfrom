<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;

class CrmService
{
    public const SEGMENT_ORDER = ['new', 'first_timer', 'repeat', 'vip', 'churned'];

    public function segmentFor(User $buyer): string
    {
        $orders = $this->paidOrders($buyer);
        $paidAt = $orders->max('paid_at');

        if ($paidAt === null) {
            return 'new';
        }

        $daysSinceLast = (int) $paidAt->copy()->startOfDay()->diffInDays(now()->startOfDay());

        if ($daysSinceLast > 90) {
            return 'churned';
        }

        $count = $orders->count();
        $monetary = (float) $orders->sum('subtotal');

        if ($count >= 5 || ($count >= 2 && $monetary >= 1_000_000)) {
            return 'vip';
        }

        if ($count >= 2) {
            return 'repeat';
        }

        return 'first_timer';
    }

    public function buyerSummary(User $buyer): array
    {
        $orders = $this->paidOrders($buyer);

        return [
            'segment' => $this->segmentFor($buyer),
            'total_orders' => $orders->count(),
            'total_spend' => (float) $orders->sum('subtotal'),
            'last_order_at' => $orders->max('paid_at')?->toIso8601String(),
            'favorite_city' => $orders->first()?->event?->city,
        ];
    }

    public function segmentCounts(int $tenantId): array
    {
        $orders = $this->tenantPaidOrders($tenantId);

        $byUser = $orders->groupBy('user_id');

        $counts = array_fill_keys(self::SEGMENT_ORDER, 0);

        foreach ($byUser as $userId => $userOrders) {
            $user = $userOrders->first()->user;
            $counts[$this->segmentFor($user)]++;
        }

        return $counts;
    }

    public function segmentMembers(int $tenantId, string $segment, int $limit = 50): Collection
    {
        $members = $this->segmentBuyers($tenantId, $segment);

        usort($members, fn ($a, $b) => $b['total_spend'] <=> $a['total_spend']);

        return collect(array_slice($members, 0, $limit));
    }

    public function segmentBuyers(int $tenantId, string $segment): array
    {
        $orders = $this->tenantPaidOrders($tenantId);
        $byUser = $orders->groupBy('user_id');

        $members = [];

        foreach ($byUser as $userId => $userOrders) {
            $user = $userOrders->first()->user;
            if ($this->segmentFor($user) !== $segment) {
                continue;
            }

            $members[] = [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'orders' => $userOrders->count(),
                'total_spend' => (float) $userOrders->sum('subtotal'),
                'last_order_at' => $userOrders->max('paid_at')?->toIso8601String(),
            ];
        }

        return $members;
    }

    public function similarEvents(array $criteria, array $excludeIds = [], int $limit = 6): Collection
    {
        $query = Event::withoutGlobalScopes()
            ->with('tenant:id,name,slug,logo,badge,trust_score')
            ->where('status', 'approved')
            ->where('start_date', '>', now())
            ->whereHas('tickets', fn ($q) => $q->where('is_active', true));

        if ($excludeIds) {
            $query->whereNotIn('id', $excludeIds);
        }

        $categoryIds = $criteria['category_ids'] ?? [];
        $city = $criteria['city'] ?? null;

        if ($categoryIds || $city) {
            $query->where(function ($q) use ($categoryIds, $city) {
                if ($categoryIds) {
                    $q->orWhereIn('category_id', $categoryIds);
                }
                if ($city) {
                    $q->orWhere('city', $city);
                }
            });
        }

        return $query->orderBy('start_date')->limit($limit)->get();
    }

    public function recommendationsFor(User $buyer, int $limit = 6): Collection
    {
        $orders = $this->paidOrders($buyer)->take(20);

        $purchasedEventIds = $orders->pluck('event_id')->filter()->values()->all();

        $categoryIds = $orders
            ->map(fn ($order) => $order->event?->category_id)
            ->filter()
            ->unique()
            ->values()
            ->all();

        $city = $orders->first()?->event?->city;

        if (! $categoryIds && ! $city) {
            return collect();
        }

        return $this->similarEvents([
            'category_ids' => $categoryIds,
            'city' => $city,
        ], $purchasedEventIds, $limit);
    }

    private function paidOrders(User $buyer): Collection
    {
        return Order::withoutGlobalScopes()
            ->with('event:id,category_id,city')
            ->where('user_id', $buyer->id)
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->get();
    }

    private function tenantPaidOrders(int $tenantId): Collection
    {
        return Order::withoutGlobalScopes()
            ->with(['user:id,name,email', 'event:id,city'])
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->orderByDesc('paid_at')
            ->get();
    }
}

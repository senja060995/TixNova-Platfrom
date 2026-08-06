<?php

namespace App\Services;

use App\Models\Event;
use App\Models\FeatureEntry;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Carbon;

class FeatureStoreService
{
    public function set(string $entityType, int $entityId, string $key, mixed $value, ?int $tenantId = null): void
    {
        FeatureEntry::updateOrCreate(
            ['entity_type' => $entityType, 'entity_id' => $entityId, 'key' => $key],
            ['tenant_id' => $tenantId, 'value' => $value, 'computed_at' => now()],
        );
    }

    public function get(string $entityType, int $entityId, string $key): mixed
    {
        return FeatureEntry::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('key', $key)
            ->value('value');
    }

    public function eventFeatures(Event $event): array
    {
        $soldTotal = (int) $event->tickets()->sum('sold');
        $quotaTotal = (int) $event->tickets()->sum('quota');
        $sellThrough = $quotaTotal > 0 ? $soldTotal / $quotaTotal : 0;

        $firstSale = Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->min('paid_at');
        $lastActivity = Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->max('paid_at');

        $soldLast7d = (int) OrderItem::join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.event_id', $event->id)
            ->where('orders.status', 'paid')
            ->where('orders.paid_at', '>=', now()->subDays(7))
            ->sum('order_items.quantity');

        $revenueTotal = (float) Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->sum('total');
        $revenue7d = (float) Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subDays(7))
            ->sum('total');
        $paidOrders = (int) Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->count();

        $daysOnSale = $firstSale
            ? max(1, (int) now()->startOfDay()->diffInDays(Carbon::parse($firstSale)->startOfDay()))
            : 0;
        $daysToEvent = $event->start_date ? max(0, (int) now()->startOfDay()->diffInDays($event->start_date->copy()->startOfDay())) : 0;

        $features = [
            'demand.sold_total' => $soldTotal,
            'demand.quota_total' => $quotaTotal,
            'demand.sell_through' => round($sellThrough, 4),
            'demand.sold_last_7d' => $soldLast7d,
            'demand.velocity_7d' => round($soldLast7d / 7, 2),
            'demand.days_on_sale' => $daysOnSale,
            'demand.days_to_event' => $daysToEvent,
            'demand.last_activity_at' => $lastActivity ? Carbon::parse($lastActivity)->toIso8601String() : null,
            'demand.revenue_total' => round($revenueTotal, 2),
            'demand.revenue_7d' => round($revenue7d, 2),
            'demand.orders_count' => $paidOrders,
            'demand.avg_order_value' => $paidOrders > 0 ? round($revenueTotal / $paidOrders, 2) : 0,
        ];

        foreach ($features as $key => $value) {
            $this->set('event', $event->id, $key, $value, $event->tenant_id);
        }

        return $features;
    }

    public function refreshEvent(Event $event): array
    {
        return $this->eventFeatures($event);
    }

    public function recordOrder(Order $order): void
    {
        if (! $order->event) {
            return;
        }

        $this->refreshEvent($order->event);
    }

    public function recordRefund(Order $order): void
    {
        if (! $order->event) {
            return;
        }

        $this->refreshEvent($order->event);
    }
}

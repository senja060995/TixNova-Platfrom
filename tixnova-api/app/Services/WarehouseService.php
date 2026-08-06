<?php

namespace App\Services;

use App\Models\Event;
use App\Models\FactEventDaily;
use App\Models\FactOrderDaily;
use App\Models\Order;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class WarehouseService
{
    /**
     * Rebuild order fact rows from paid orders.
     */
    public function rebuildOrders(?Carbon $from = null, ?int $tenantId = null): int
    {
        $deleteQuery = FactOrderDaily::query();
        if ($tenantId) {
            $deleteQuery->where('tenant_id', $tenantId);
        }
        if ($from) {
            $deleteQuery->whereDate('sale_date', '>=', $from->toDateString());
        }
        $deleteQuery->delete();

        $query = Order::withoutGlobalScopes()
            ->join('order_items', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'paid')
            ->whereNotNull('orders.paid_at')
            ->selectRaw('orders.tenant_id, orders.event_id, DATE(orders.paid_at) AS sale_date, '.'
                COUNT(DISTINCT orders.id) AS orders_count, '.'
                SUM(order_items.quantity) AS tickets_sold, '.'
                SUM(orders.subtotal) AS gross_amount, '.'
                SUM(orders.discount) AS discount_amount, '.'
                SUM(orders.admin_fee) AS admin_fee, '.'
                SUM(orders.commission_fee) AS commission_fee, '.'
                SUM(orders.total) AS net_amount')
            ->groupBy('orders.tenant_id', 'orders.event_id', 'sale_date');

        if ($from) {
            $query->whereDate('orders.paid_at', '>=', $from);
        }

        if ($tenantId) {
            $query->where('orders.tenant_id', $tenantId);
        }

        $count = 0;

        foreach ($query->get() as $row) {
            FactOrderDaily::create([
                'tenant_id' => $row->tenant_id,
                'event_id' => $row->event_id,
                'sale_date' => Carbon::parse($row->sale_date)->toDateString(),
                'orders_count' => (int) $row->orders_count,
                'tickets_sold' => (int) $row->tickets_sold,
                'gross_amount' => (float) $row->gross_amount,
                'discount_amount' => (float) $row->discount_amount,
                'admin_fee' => (float) $row->admin_fee,
                'commission_fee' => (float) $row->commission_fee,
                'net_amount' => (float) $row->net_amount,
            ]);
            $count++;
        }

        return $count;
    }

    /**
     * Rebuild event daily snapshots from order facts (cumulative).
     */
    public function rebuildSnapshots(?Carbon $from = null, ?int $tenantId = null): int
    {
        $deleteQuery = FactEventDaily::query();
        if ($tenantId) {
            $deleteQuery->where('tenant_id', $tenantId);
        }
        if ($from) {
            $deleteQuery->whereDate('snapshot_date', '>=', $from->toDateString());
        }
        $deleteQuery->delete();

        $datesQuery = FactOrderDaily::query()
            ->distinct()
            ->orderBy('sale_date');

        if ($from) {
            $datesQuery->whereDate('sale_date', '>=', $from->toDateString());
        }

        if ($tenantId) {
            $datesQuery->where('tenant_id', $tenantId);
        }

        $dates = $datesQuery->pluck('sale_date')
            ->map(fn ($d) => Carbon::parse($d)->startOfDay())
            ->values();

        $today = now()->startOfDay();
        if ($dates->doesntContain(fn (Carbon $d) => $d->eq($today))) {
            $dates->push($today);
        }

        $eventsQuery = Event::withoutGlobalScopes();
        if ($tenantId) {
            $eventsQuery->where('tenant_id', $tenantId);
        }
        $events = $eventsQuery->get();

        $count = 0;

        foreach ($events as $event) {
            if ($this->snapshotEvent($event, $dates, $from)) {
                $count++;
            }
        }

        return $count;
    }

    public function rebuildAll(?int $tenantId = null): array
    {
        return [
            'orders' => $this->rebuildOrders(null, $tenantId),
            'snapshots' => $this->rebuildSnapshots(null, $tenantId),
        ];
    }

    public function rebuildSince(int $days, ?int $tenantId = null): array
    {
        $from = now()->subDays($days)->startOfDay();

        return [
            'orders' => $this->rebuildOrders($from, $tenantId),
            'snapshots' => $this->rebuildSnapshots($from, $tenantId),
        ];
    }

    private function snapshotEvent(Event $event, Collection $dates, ?Carbon $from): bool
    {
        $facts = FactOrderDaily::where('event_id', $event->id)
            ->orderBy('sale_date')
            ->get();

        if ($facts->isEmpty()) {
            return false;
        }

        $byDate = $facts->keyBy(fn (FactOrderDaily $f) => $f->sale_date->toDateString());
        $quota = (int) $event->tickets()->sum('quota');
        $cumTickets = 0;
        $cumRevenue = 0.0;
        $wrote = false;

        foreach ($dates as $date) {
            if ($from && $date->lt($from)) {
                continue;
            }

            $day = $byDate->get($date->toDateString());

            if ($day) {
                $cumTickets += (int) $day->tickets_sold;
                $cumRevenue += (float) $day->net_amount;
            }

            $tickets7d = $facts->filter(fn (FactOrderDaily $f) => $f->sale_date->between($date->copy()->subDays(6), $date))
                ->sum(fn (FactOrderDaily $f) => (int) $f->tickets_sold);
            $sellThrough = $quota > 0 ? round($cumTickets / $quota * 100) : 0;
            $daysToEvent = $event->start_date
                ? max(0, (int) $date->diffInDays($event->start_date->copy()->startOfDay()))
                : 0;

            FactEventDaily::create([
                'tenant_id' => $event->tenant_id,
                'event_id' => $event->id,
                'snapshot_date' => $date->toDateString(),
                'sold_total' => $cumTickets,
                'quota_total' => $quota,
                'sell_through_pct' => $sellThrough,
                'revenue_total' => $cumRevenue,
                'tickets_7d' => $tickets7d,
                'days_to_event' => $daysToEvent,
                'computed_at' => now(),
            ]);
            $wrote = true;
        }

        return $wrote;
    }
}

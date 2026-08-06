<?php

namespace App\Services;

use App\Models\Event;
use App\Models\FactEventDaily;
use App\Models\FactOrderDaily;
use App\Models\Order;
use App\Models\Ticket;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class InsightService
{
    public function __construct(private WarehouseService $warehouse) {}

    public function overview(int $tenantId, int $days = 30): array
    {
        $this->ensureOrdersBuilt($tenantId);

        $from = now()->subDays(max(1, $days) - 1)->startOfDay();

        $facts = FactOrderDaily::where('tenant_id', $tenantId)
            ->whereDate('sale_date', '>=', $from->toDateString())
            ->orderBy('sale_date')
            ->get();

        $series = $facts->groupBy(fn (FactOrderDaily $f) => $f->sale_date->toDateString())
            ->map(fn (Collection $rows) => [
                'date' => $rows->first()->sale_date->toIso8601String(),
                'orders_count' => (int) $rows->sum('orders_count'),
                'tickets_sold' => (int) $rows->sum('tickets_sold'),
                'net_amount' => round($rows->sum(fn (FactOrderDaily $r) => (float) $r->net_amount), 2),
            ])
            ->values();

        $orders = (int) $facts->sum('orders_count');
        $tickets = (int) $facts->sum('tickets_sold');
        $gmv = round($facts->sum(fn (FactOrderDaily $r) => (float) $r->net_amount), 2);
        $eventsActive = (int) $facts->pluck('event_id')->unique()->count();

        return [
            'period_days' => $days,
            'gmv' => $gmv,
            'tickets_sold' => $tickets,
            'orders' => $orders,
            'avg_order_value' => $orders > 0 ? round($gmv / $orders, 2) : 0,
            'events_active' => $eventsActive,
            'avg_sell_through_pct' => $this->avgSellThrough($tenantId),
            'series' => $series,
        ];
    }

    public function benchmark(?string $city = null, ?int $categoryId = null): array
    {
        $query = Event::withoutGlobalScopes()
            ->where('status', 'approved')
            ->where('start_date', '>', now());

        if ($city) {
            $query->where('city', $city);
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $events = $query->limit(200)->get();
        $revenues = $this->revenuesByEvent($events->pluck('id'));

        $prices = [];
        $sellThroughs = [];
        $ticketsSold = [];

        foreach ($events as $event) {
            $ticketPrices = $event->tickets
                ->filter(fn (Ticket $t) => $t->is_active)
                ->map(fn (Ticket $t) => (float) $t->currentPrice())
                ->filter(fn ($p) => $p > 0);

            if ($ticketPrices->isNotEmpty()) {
                $prices[] = round($ticketPrices->avg(), 2);
            }

            $quota = (int) $event->tickets()->sum('quota');
            $sold = (int) $event->tickets()->sum('sold');

            if ($quota > 0) {
                $sellThroughs[] = $sold / $quota;
            }

            $ticketsSold[] = $sold;
        }

        return [
            'filter' => ['city' => $city, 'category_id' => $categoryId],
            'event_count' => $events->count(),
            'avg_ticket_price' => $prices ? round(array_sum($prices) / count($prices), 2) : 0,
            'median_ticket_price' => $prices ? $this->median($prices) : 0,
            'avg_sell_through_pct' => $sellThroughs ? round(array_sum($sellThroughs) / count($sellThroughs) * 100) : 0,
            'avg_tickets_sold' => $ticketsSold ? round(array_sum($ticketsSold) / count($ticketsSold), 2) : 0,
            'avg_revenue' => $revenues->isNotEmpty() ? round($revenues->avg(), 2) : 0,
        ];
    }

    public function eventInsight(Event $event): array
    {
        $sold = (int) $event->tickets()->sum('sold');
        $quota = (int) $event->tickets()->sum('quota');
        $sellThrough = $quota > 0 ? $sold / $quota : 0;

        $orderStats = Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->selectRaw('COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS revenue, MIN(paid_at) AS first_paid')
            ->first();

        $revenue = (float) $orderStats->revenue;
        $orders = (int) $orderStats->order_count;
        $revenue7d = (float) Order::withoutGlobalScopes()
            ->where('event_id', $event->id)
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subDays(7))
            ->sum('total');
        $sold7d = $this->ticketsSold7d($event->id);

        $daysOnSale = $orderStats->first_paid
            ? max(1, (int) now()->startOfDay()->diffInDays(Carbon::parse($orderStats->first_paid)->startOfDay()))
            : 0;
        $velocity = $sold7d / 7;

        $prices = $event->tickets
            ->filter(fn (Ticket $t) => $t->is_active)
            ->map(fn (Ticket $t) => (float) $t->currentPrice())
            ->filter(fn ($p) => $p > 0);
        $avgPrice = $prices->isNotEmpty() ? round($prices->avg(), 2) : 0;

        $benchmark = $this->benchmarkFor($event);

        $remainingDays = $event->start_date
            ? max(0, (int) now()->startOfDay()->diffInDays($event->start_date->copy()->startOfDay()))
            : 0;
        $expectedVelocity = max($velocity, $benchmark['avg_daily_sales']);
        $expectedFinal = (int) ceil($sold + $expectedVelocity * $remainingDays);
        if ($quota > 0) {
            $expectedFinal = min($expectedFinal, $quota);
        }

        $ratio = fn ($a, $b) => $b > 0 ? round($a / $b, 2) : null;

        $status = 'no_benchmark';
        if ($benchmark['avg_sell_through'] > 0) {
            if ($sellThrough > $benchmark['avg_sell_through'] * 1.2) {
                $status = 'above';
            } elseif ($sellThrough < $benchmark['avg_sell_through'] * 0.8) {
                $status = 'below';
            } else {
                $status = 'par';
            }
        }

        return [
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'slug' => $event->slug,
                'city' => $event->city,
                'start_date' => $event->start_date?->toIso8601String(),
            ],
            'performance' => [
                'gmv' => round($revenue, 2),
                'tickets_sold' => $sold,
                'quota' => $quota,
                'orders' => $orders,
                'sell_through_pct' => round($sellThrough * 100),
                'avg_order_value' => $orders > 0 ? round($revenue / $orders, 2) : 0,
                'avg_price' => $avgPrice,
                'revenue_7d' => round($revenue7d, 2),
                'tickets_sold_7d' => $sold7d,
                'velocity_7d' => round($velocity, 2),
                'days_on_sale' => $daysOnSale,
                'days_to_event' => $remainingDays,
            ],
            'benchmark' => $benchmark,
            'vs_benchmark' => [
                'status' => $status,
                'tickets_sold_ratio' => $ratio($sold, $benchmark['avg_tickets_sold']),
                'sell_through_ratio' => $ratio($sellThrough, $benchmark['avg_sell_through']),
                'avg_price_ratio' => $ratio($avgPrice, $benchmark['avg_price']),
                'expected_final_tickets' => $expectedFinal,
                'expected_sell_through_pct' => $quota > 0 ? (int) round($expectedFinal / $quota * 100) : 0,
            ],
        ];
    }

    public function eventDaily(Event $event): Collection
    {
        $this->ensureSnapshotsBuilt($event->tenant_id);

        return FactEventDaily::where('event_id', $event->id)
            ->orderBy('snapshot_date')
            ->get()
            ->map(fn (FactEventDaily $f) => [
                'snapshot_date' => $f->snapshot_date->toIso8601String(),
                'sold_total' => $f->sold_total,
                'quota_total' => $f->quota_total,
                'sell_through_pct' => $f->sell_through_pct,
                'revenue_total' => (float) $f->revenue_total,
                'tickets_7d' => $f->tickets_7d,
                'days_to_event' => $f->days_to_event,
            ]);
    }

    private function benchmarkFor(Event $event): array
    {
        $query = Event::withoutGlobalScopes()
            ->where('status', 'approved')
            ->where('start_date', '>', now())
            ->whereKeyNot($event->id)
            ->where(function ($q) use ($event) {
                if ($event->category_id) {
                    $q->orWhere('category_id', $event->category_id);
                }
                if ($event->city) {
                    $q->orWhere('city', $event->city);
                }
            });

        $events = $query->limit(100)->get();
        $revenues = $this->revenuesByEvent($events->pluck('id'));

        $prices = [];
        $sellThroughs = [];
        $ticketsSold = [];
        $dailySales = [];

        foreach ($events as $benchEvent) {
            $ticketPrices = $benchEvent->tickets
                ->filter(fn (Ticket $t) => $t->is_active)
                ->map(fn (Ticket $t) => (float) $t->currentPrice())
                ->filter(fn ($p) => $p > 0);

            if ($ticketPrices->isNotEmpty()) {
                $prices[] = round($ticketPrices->avg(), 2);
            }

            $quota = (int) $benchEvent->tickets()->sum('quota');
            $sold = (int) $benchEvent->tickets()->sum('sold');
            $ticketsSold[] = $sold;

            if ($quota > 0) {
                $sellThroughs[] = $sold / $quota;
            }

            $firstPaid = $revenues->get($benchEvent->id)?->first_paid;
            $daysOnSale = $firstPaid
                ? max(1, (int) now()->startOfDay()->diffInDays(Carbon::parse($firstPaid)->startOfDay()))
                : 0;
            if ($sold > 0 && $daysOnSale > 0) {
                $dailySales[] = $sold / $daysOnSale;
            }
        }

        return [
            'event_count' => $events->count(),
            'avg_price' => $prices ? round(array_sum($prices) / count($prices), 2) : 0,
            'avg_sell_through' => $sellThroughs ? round(array_sum($sellThroughs) / count($sellThroughs), 4) : 0,
            'avg_tickets_sold' => $ticketsSold ? round(array_sum($ticketsSold) / count($ticketsSold), 2) : 0,
            'avg_revenue' => $revenues->isNotEmpty() ? round($revenues->avg(), 2) : 0,
            'avg_daily_sales' => $dailySales ? round(array_sum($dailySales) / count($dailySales), 2) : 0,
        ];
    }

    private function revenuesByEvent($eventIds): Collection
    {
        if ($eventIds->isEmpty()) {
            return collect();
        }

        return Order::withoutGlobalScopes()
            ->whereIn('event_id', $eventIds)
            ->where('status', 'paid')
            ->selectRaw('event_id, COUNT(*) AS order_count, COALESCE(SUM(total), 0) AS revenue, MIN(paid_at) AS first_paid')
            ->groupBy('event_id')
            ->get()
            ->keyBy('event_id')
            ->map(fn ($row) => [
                'order_count' => (int) $row->order_count,
                'revenue' => (float) $row->revenue,
                'first_paid' => $row->first_paid,
            ]);
    }

    private function ticketsSold7d(int $eventId): int
    {
        return (int) Order::withoutGlobalScopes()
            ->join('order_items', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.event_id', $eventId)
            ->where('orders.status', 'paid')
            ->where('orders.paid_at', '>=', now()->subDays(7))
            ->sum('order_items.quantity');
    }

    private function avgSellThrough(int $tenantId): int
    {
        $values = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->get()
            ->map(fn (Event $e) => (int) $e->tickets()->sum('quota') > 0
                ? (int) $e->tickets()->sum('sold') / (int) $e->tickets()->sum('quota')
                : null)
            ->filter();

        return $values->isNotEmpty() ? round($values->avg() * 100) : 0;
    }

    private function ensureOrdersBuilt(int $tenantId): void
    {
        if (! FactOrderDaily::where('tenant_id', $tenantId)->exists()) {
            $this->warehouse->rebuildAll($tenantId);
        }
    }

    private function ensureSnapshotsBuilt(int $tenantId): void
    {
        if (! FactEventDaily::where('tenant_id', $tenantId)->exists()) {
            $this->warehouse->rebuildAll($tenantId);
        }
    }

    private function median(array $values): float
    {
        sort($values);
        $n = count($values);
        $mid = intdiv($n, 2);

        return $n % 2 === 0
            ? round(($values[$mid - 1] + $values[$mid]) / 2, 2)
            : round($values[$mid], 2);
    }
}

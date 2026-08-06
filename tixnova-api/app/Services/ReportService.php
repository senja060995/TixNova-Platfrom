<?php

namespace App\Services;

use App\Models\Order;
use App\Models\ScanLog;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function promotorReport(int $tenantId, array $filters): array
    {
        [$startDate, $endDate] = $this->dateRange($filters);
        $orders = $this->paidOrders($startDate, $endDate)
            ->where('tenant_id', $tenantId)
            ->when(isset($filters['event_id']), fn (Builder $query) => $query->where('event_id', $filters['event_id']));
        $summary = $this->summary($orders);
        $attendance = $this->attendance($tenantId, $startDate, $endDate, $filters['event_id'] ?? null);

        return [
            'filters' => $this->filterData($startDate, $endDate),
            'summary' => $summary,
            'attendance' => $attendance,
            'breakdown' => $this->breakdown($orders),
            'tickets' => $this->ticketBreakdown($tenantId, $startDate, $endDate, $filters['event_id'] ?? null),
        ];
    }

    public function platformReport(array $filters): array
    {
        [$startDate, $endDate] = $this->dateRange($filters);
        $orders = $this->paidOrders($startDate, $endDate);
        $summary = $this->summary($orders);

        return [
            'filters' => $this->filterData($startDate, $endDate),
            'summary' => [
                ...$summary,
                'total_tenants' => Tenant::active()->count(),
            ],
            'breakdown' => $this->breakdown($orders),
            'top_tenants' => $this->topTenants($startDate, $endDate),
        ];
    }

    public function exportRows(?int $tenantId, array $filters): Collection
    {
        [$startDate, $endDate] = $this->dateRange($filters);

        return $this->paidOrders($startDate, $endDate)
            ->when($tenantId, fn (Builder $query) => $query->where('tenant_id', $tenantId))
            ->with(['event:id,title', 'tenant:id,name'])
            ->orderBy('paid_at')
            ->get()
            ->map(fn (Order $order) => [
                'Kode Order' => $order->order_code,
                'Event' => $order->event?->title ?? '-',
                'Promotor' => $order->tenant?->name ?? '-',
                'Tanggal Pembayaran' => $order->paid_at?->format('Y-m-d H:i:s'),
                'Subtotal Tiket' => (float) $order->subtotal,
                'Diskon' => (float) $order->discount,
                'Biaya Admin' => (float) $order->admin_fee,
                'GMV' => (float) $order->total,
                'Komisi Platform' => (float) $order->commission_fee,
                'Payout Promotor' => $this->payout($order),
            ]);
    }

    private function paidOrders(Carbon $startDate, Carbon $endDate): Builder
    {
        return Order::withoutGlobalScopes()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$startDate, $endDate]);
    }

    private function summary(Builder $orders): array
    {
        $totals = (clone $orders)
            ->selectRaw('COUNT(*) as paid_orders, COALESCE(SUM(subtotal), 0) as ticket_revenue, COALESCE(SUM(discount), 0) as discount, COALESCE(SUM(admin_fee), 0) as admin_fee, COALESCE(SUM(total), 0) as gmv, COALESCE(SUM(commission_fee), 0) as platform_commission')
            ->first();

        $platformCommission = (float) $totals->platform_commission;
        $ticketRevenue = (float) $totals->ticket_revenue;

        return [
            'paid_orders' => (int) $totals->paid_orders,
            'ticket_revenue' => $ticketRevenue,
            'discount' => (float) $totals->discount,
            'admin_fee' => (float) $totals->admin_fee,
            'gmv' => (float) $totals->gmv,
            'platform_commission' => $platformCommission,
            'promotor_payout' => max(0, $ticketRevenue - $platformCommission),
        ];
    }

    private function attendance(int $tenantId, Carbon $startDate, Carbon $endDate, ?int $eventId): array
    {
        $ticketsSold = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', 'paid')
            ->whereBetween('orders.paid_at', [$startDate, $endDate])
            ->when($eventId, fn ($query) => $query->where('orders.event_id', $eventId))
            ->sum('order_items.quantity');

        $checkedIn = ScanLog::query()
            ->where('scan_status', 'valid')
            ->whereBetween('scanned_at', [$startDate, $endDate])
            ->whereHas('event', fn (Builder $query) => $query->withoutGlobalScopes()->where('tenant_id', $tenantId))
            ->when($eventId, fn (Builder $query) => $query->where('event_id', $eventId))
            ->count();

        return [
            'tickets_sold' => (int) $ticketsSold,
            'checked_in' => (int) $checkedIn,
            'check_in_rate' => $ticketsSold > 0 ? round(($checkedIn / $ticketsSold) * 100, 2) : 0,
        ];
    }

    private function breakdown(Builder $orders): Collection
    {
        $period = DB::connection()->getDriverName() === 'pgsql'
            ? "to_char(paid_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')"
            : "strftime('%Y-%m-%d', paid_at)";

        return (clone $orders)
            ->selectRaw("{$period} as period, COUNT(*) as paid_orders, COALESCE(SUM(subtotal), 0) as ticket_revenue, COALESCE(SUM(total), 0) as gmv, COALESCE(SUM(commission_fee), 0) as platform_commission")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'paid_orders' => (int) $row->paid_orders,
                'ticket_revenue' => (float) $row->ticket_revenue,
                'gmv' => (float) $row->gmv,
                'platform_commission' => (float) $row->platform_commission,
                'promotor_payout' => max(0, (float) $row->ticket_revenue - (float) $row->platform_commission),
            ]);
    }

    private function ticketBreakdown(int $tenantId, Carbon $startDate, Carbon $endDate, ?int $eventId): Collection
    {
        return DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('tickets', 'tickets.id', '=', 'order_items.ticket_id')
            ->where('orders.tenant_id', $tenantId)
            ->where('orders.status', 'paid')
            ->whereBetween('orders.paid_at', [$startDate, $endDate])
            ->when($eventId, fn ($query) => $query->where('orders.event_id', $eventId))
            ->selectRaw('tickets.id, tickets.name, tickets.price, SUM(order_items.quantity) as sold, SUM(order_items.price * order_items.quantity) as ticket_revenue')
            ->groupBy('tickets.id', 'tickets.name', 'tickets.price')
            ->orderByDesc('sold')
            ->get()
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'name' => $row->name,
                'price' => (float) $row->price,
                'sold' => (int) $row->sold,
                'ticket_revenue' => (float) $row->ticket_revenue,
            ]);
    }

    private function topTenants(Carbon $startDate, Carbon $endDate): Collection
    {
        return Tenant::query()
            ->leftJoin('orders', function ($join) use ($startDate, $endDate) {
                $join->on('orders.tenant_id', '=', 'tenants.id')
                    ->where('orders.status', 'paid')
                    ->whereBetween('orders.paid_at', [$startDate, $endDate]);
            })
            ->selectRaw('tenants.id, tenants.name, COUNT(orders.id) as paid_orders, COALESCE(SUM(orders.subtotal), 0) as ticket_revenue, COALESCE(SUM(orders.total), 0) as gmv, COALESCE(SUM(orders.commission_fee), 0) as platform_commission')
            ->groupBy('tenants.id', 'tenants.name')
            ->orderByDesc('gmv')
            ->limit(5)
            ->get()
            ->map(fn ($tenant) => [
                'id' => (int) $tenant->id,
                'name' => $tenant->name,
                'paid_orders' => (int) $tenant->paid_orders,
                'ticket_revenue' => (float) $tenant->ticket_revenue,
                'gmv' => (float) $tenant->gmv,
                'platform_commission' => (float) $tenant->platform_commission,
                'promotor_payout' => max(0, (float) $tenant->ticket_revenue - (float) $tenant->platform_commission),
            ]);
    }

    private function dateRange(array $filters): array
    {
        $data = validator($filters, [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'days' => ['nullable', 'integer', 'in:7,30,90,365'],
        ])->validate();

        if (isset($data['start_date']) || isset($data['end_date'])) {
            return [
                Carbon::parse($data['start_date'] ?? now()->subDays(29))->startOfDay(),
                Carbon::parse($data['end_date'] ?? now())->endOfDay(),
            ];
        }

        $days = $data['days'] ?? 30;

        return [now()->subDays($days - 1)->startOfDay(), now()->endOfDay()];
    }

    private function filterData(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'timezone' => 'UTC',
        ];
    }

    private function payout(Order $order): float
    {
        return max(0, (float) $order->subtotal - (float) $order->commission_fee);
    }
}

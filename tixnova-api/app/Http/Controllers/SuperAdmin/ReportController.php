<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get revenue report.
     */
    public function revenue(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subMonths(12)->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());
        $groupBy = $request->get('group_by', 'month'); // day, week, month

        $query = Order::withoutGlobalScope('tenant')
            ->where('status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate]);

        $format = match ($groupBy) {
            'day' => "to_char(created_at, 'YYYY-MM-DD')",
            'week' => "to_char(created_at, 'YYYY-IW')",
            'month' => "to_char(created_at, 'YYYY-MM')",
            default => "to_char(created_at, 'YYYY-MM')",
        };

        $revenueData = $query->select(
            DB::raw("{$format} as period"),
            DB::raw('SUM(total) as revenue'),
            DB::raw('SUM(commission_fee) as commission'),
            DB::raw('COUNT(*) as order_count')
        )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        // Summary totals
        $summary = [
            'total_revenue' => $query->sum('total'),
            'total_commission' => $query->sum('commission_fee'),
            'total_orders' => $query->count(),
        ];

        return response()->json([
            'success' => true,
            'data'    => [
                'summary'    => $summary,
                'breakdown'  => $revenueData,
            ],
        ]);
    }

    /**
     * Export report to CSV/Excel.
     */
    public function export(Request $request): JsonResponse
    {
        $format = $request->get('format', 'csv'); // csv, excel
        $type = $request->get('type', 'revenue'); // revenue, orders, tenants

        // This is a placeholder - actual implementation would use Laravel Excel
        return response()->json([
            'success' => true,
            'message' => "Export {$type} report in {$format} format - to be implemented with Laravel Excel",
            'data'    => [
                'download_url' => null,
            ],
        ]);
    }

    /**
     * Get tenant performance report.
     */
    public function tenants(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', now()->subMonths(12)->startOfMonth());
        $endDate = $request->get('end_date', now()->endOfMonth());

        $tenants = Tenant::withCount(['orders' => fn ($q) => $q->where('status', 'paid')->whereBetween('created_at', [$startDate, $endDate])])
            ->withSum(['orders' => fn ($q) => $q->where('status', 'paid')->whereBetween('created_at', [$startDate, $endDate])], 'total')
            ->withSum(['orders' => fn ($q) => $q->where('status', 'paid')->whereBetween('created_at', [$startDate, $endDate])], 'commission_fee')
            ->orderByDesc('orders_sum_total')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'success' => true,
            'data'    => $tenants,
        ]);
    }
}
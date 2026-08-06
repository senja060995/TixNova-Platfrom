<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = [
            'total_tenants' => Tenant::count(),
            'active_tenants' => Tenant::active()->count(),
            'pending_tenants' => Tenant::where('status', 'pending')->count(),
            'total_events' => Event::withoutGlobalScope('tenant')->count(),
            'pending_events' => Event::withoutGlobalScope('tenant')->where('status', 'pending')->count(),
            'approved_events' => Event::withoutGlobalScope('tenant')->where('status', 'approved')->count(),
            'total_users' => User::count(),
            'total_orders' => Order::withoutGlobalScope('tenant')->count(),
            'paid_orders' => Order::withoutGlobalScope('tenant')->where('status', 'paid')->count(),
            'total_revenue' => Order::withoutGlobalScope('tenant')->where('status', 'paid')->sum('total'),
            'platform_commission' => Order::withoutGlobalScope('tenant')->where('status', 'paid')->sum('commission_fee'),
        ];

        $driver = DB::connection()->getDriverName();
        $monthExpr = $driver === 'pgsql'
            ? "to_char(created_at, 'YYYY-MM')"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        // Revenue chart (last 12 months)
        $revenueChart = Order::withoutGlobalScope('tenant')
            ->where('status', 'paid')
            ->where('created_at', '>=', now()->subMonths(12))
            ->select(
                DB::raw("{$monthExpr} as month"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('SUM(commission_fee) as commission'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Top tenants by revenue
        $topTenants = Tenant::withCount(['orders' => fn ($q) => $q->where('status', 'paid')])
            ->withSum(['orders' => fn ($q) => $q->where('status', 'paid')], 'total')
            ->orderByDesc('orders_sum_total')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'revenue_chart' => $revenueChart,
                'top_tenants' => $topTenants,
            ],
        ]);
    }
}

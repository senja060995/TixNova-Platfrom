<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * GET /api/promotor/dashboard/stats — Stats overview for Promotor
     */
    public function stats(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $eventsCount = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->count();

        $activeEventsCount = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->where('end_date', '>', now())
            ->count();

        $totalOrders = Order::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->count();

        $totalRevenue = Order::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'paid')
            ->sum('subtotal');

        $ticketsSold = Ticket::whereHas('event', fn ($q) => $q->withoutGlobalScopes()->where('tenant_id', $tenantId))
            ->sum('sold');

        $recentOrders = Order::withoutGlobalScopes()
            ->with(['event:id,title', 'items.ticket'])
            ->where('tenant_id', $tenantId)
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_events' => $eventsCount,
                'active_events' => $activeEventsCount,
                'total_orders' => $totalOrders,
                'total_revenue' => (float) $totalRevenue,
                'tickets_sold' => (int) $ticketsSold,
                'recent_orders' => $recentOrders,
            ],
        ]);
    }
}

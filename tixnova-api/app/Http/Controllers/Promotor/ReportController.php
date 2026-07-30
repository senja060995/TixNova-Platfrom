<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * GET /api/promotor/events/{id}/reports — Laporan penjualan event spesifik
     */
    public function eventReport(int $eventId): JsonResponse
    {
        $event = Event::findOrFail($eventId);

        $orders = Order::where('event_id', $eventId)->get();
        $tickets = Ticket::where('event_id', $eventId)->get();

        $totalRevenue = $orders->where('status', 'paid')->sum('total');
        $totalOrders  = $orders->count();
        $paidOrders   = $orders->where('status', 'paid')->count();
        $ticketsSold  = $tickets->sum('sold');
        $totalQuota   = $tickets->sum('quota');

        return response()->json([
            'success' => true,
            'data'    => [
                'event'         => [
                    'id'    => $event->id,
                    'title' => $event->title,
                    'status'=> $event->status,
                ],
                'summary'       => [
                    'total_revenue' => (float) $totalRevenue,
                    'total_orders'  => $totalOrders,
                    'paid_orders'   => $paidOrders,
                    'tickets_sold'  => $ticketsSold,
                    'total_quota'   => $totalQuota,
                ],
                'ticket_breakdown' => $tickets->map(fn($t) => [
                    'id'    => $t->id,
                    'name'  => $t->name,
                    'price' => (float) $t->price,
                    'quota' => $t->quota,
                    'sold'  => $t->sold,
                    'revenue' => (float) ($t->price * $t->sold),
                ]),
            ],
        ]);
    }

    /**
     * GET /api/promotor/reports/export — Export laporan penjualan promotor
     */
    public function export(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;

        $orders = Order::where('tenant_id', $tenantId)
            ->with(['event:id,title', 'items'])
            ->latest()
            ->get();

        $data = $orders->map(fn($o) => [
            'Order Code'   => $o->order_code,
            'Buyer Name'   => $o->buyer_name,
            'Buyer Email'  => $o->buyer_email,
            'Event'        => $o->event?->title ?? '-',
            'Total'        => $o->total,
            'Status'       => $o->status,
            'Date'         => $o->created_at->format('Y-m-d H:i:s'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan penjualan berhasil dibuat.',
            'data'    => $data,
        ]);
    }
}

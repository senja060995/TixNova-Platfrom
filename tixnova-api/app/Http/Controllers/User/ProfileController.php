<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * GET /api/user/profile — Profile info & stats
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('tenant');

        $totalOrders = Order::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->count();

        $totalTickets = OrderItem::whereHas('order', function ($q) use ($user) {
            $q->withoutGlobalScopes()->where('user_id', $user->id)->where('status', 'paid');
        })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'total_orders' => $totalOrders,
                'total_tickets' => $totalTickets,
            ],
        ]);
    }

    /**
     * PUT /api/user/profile — Update user profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $data = [
            'name' => $request->name,
            'phone' => $request->phone,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * GET /api/user/orders — Riwayat transaksi pembelian user
     */
    public function orders(Request $request): JsonResponse
    {
        $user = $request->user();

        $orders = Order::withoutGlobalScopes()
            ->with(['event:id,title,venue,city,start_date,banner', 'items.ticket', 'items.seat', 'payment'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * GET /api/user/tickets — Semua tiket aktif milik user
     */
    public function tickets(Request $request): JsonResponse
    {
        $user = $request->user();

        $tickets = OrderItem::with(['order.event', 'ticket', 'seat'])
            ->whereHas('order', function ($q) use ($user) {
                $q->withoutGlobalScopes()->where('user_id', $user->id)->where('status', 'paid');
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tickets->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'qr_code' => $item->qr_code,
                'qr_used' => $item->qr_used,
                'attendee_name' => $item->attendee_name,
                'attendee_email' => $item->attendee_email,
                'seat_label' => $item->seat?->label ?? $item->seat_number,
                'ticket' => [
                    'name' => $item->ticket->name,
                    'type' => $item->ticket->type,
                    'price' => (float) $item->ticket->price,
                ],
                'order' => [
                    'order_code' => $item->order->order_code,
                    'event' => [
                        'title' => $item->order->event->title,
                        'venue' => $item->order->event->venue,
                        'city' => $item->order->event->city,
                        'start_date' => $item->order->event->start_date?->toIso8601String(),
                        'banner' => $item->order->event->banner,
                    ],
                ],
            ])->values(),
        ]);
    }
}

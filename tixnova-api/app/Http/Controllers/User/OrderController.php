<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CreateOrderRequest;
use App\Models\Order;
use App\Models\Payment;
use App\Services\CheckoutService;
use App\Services\InventoryReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct(
        private CheckoutService $checkout,
        private InventoryReservationService $inventory,
    ) {}

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $order = $this->checkout->create($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil dibuat. Lanjutkan pembayaran untuk mengamankan tiket.',
            'data' => $this->orderData($order, false),
        ], 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $order = $this->ownedOrder($request, $code)->load(['event', 'items.ticket', 'items.seat', 'payment']);

        return response()->json([
            'success' => true,
            'data' => $this->orderData($order, $order->isPaid()),
        ]);
    }

    public function cancel(Request $request, string $code): JsonResponse
    {
        DB::transaction(function () use ($request, $code) {
            $order = $this->ownedOrder($request, $code, true)->load('items');

            if ($order->status !== 'pending') {
                abort(422, 'Hanya order pending yang dapat dibatalkan.');
            }

            $this->inventory->release($order);
            $order->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
            Payment::where('order_id', $order->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->update(['status' => 'failed']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil dibatalkan.',
        ]);
    }

    private function ownedOrder(Request $request, string $code, bool $lock = false): Order
    {
        $query = Order::withoutGlobalScopes()
            ->where('order_code', $code)
            ->where('user_id', $request->user()->id);

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    private function orderData(Order $order, bool $includeQr): array
    {
        return [
            'order_code' => $order->order_code,
            'status' => $order->status,
            'subtotal' => (float) $order->subtotal,
            'admin_fee' => (float) $order->admin_fee,
            'discount' => (float) $order->discount,
            'total' => (float) $order->total,
            'expired_at' => $order->expired_at?->toIso8601String(),
            'paid_at' => $order->paid_at?->toIso8601String(),
            'buyer_name' => $order->buyer_name,
            'buyer_email' => $order->buyer_email,
            'buyer_phone' => $order->buyer_phone,
            'event' => [
                'title' => $order->event->title,
                'venue' => $order->event->venue,
                'city' => $order->event->city,
                'start_date' => $order->event->start_date?->toIso8601String(),
                'banner' => $order->event->banner,
            ],
            'items' => $order->items->map(fn ($item) => array_filter([
                'id' => $item->id,
                'ticket' => [
                    'name' => $item->ticket->name,
                    'type' => $item->ticket->type,
                    'price' => (float) $item->ticket->price,
                ],
                'attendee_name' => $item->attendee_name,
                'attendee_email' => $item->attendee_email,
                'seat_label' => $item->seat?->label ?? $item->seat_number,
                'qr_code' => $includeQr ? $item->qr_code : null,
            ], fn ($value) => $value !== null))->values(),
            'payment' => $order->payment ? [
                'method' => $order->payment->method,
                'status' => $order->payment->status,
                'payment_url' => $order->payment->payment_url,
            ] : null,
        ];
    }
}

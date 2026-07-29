<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * POST /api/orders — Buat order baru
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'event_id'      => 'required|exists:events,id',
            'buyer_name'    => 'required|string|max:255',
            'buyer_email'   => 'required|email|max:255',
            'buyer_phone'   => 'required|string|max:20',
            'items'         => 'required|array|min:1',
            'items.*.ticket_id' => 'required|exists:tickets,id',
            'items.*.quantity'  => 'required|integer|min:1|max:10',
            'payment_method'    => 'nullable|string',
        ]);

        $event = Event::withoutGlobalScopes()->findOrFail($request->event_id);

        DB::beginTransaction();
        try {
            $subtotal = 0;
            $itemsToCreate = [];

            foreach ($request->items as $itemData) {
                $ticket = Ticket::where('event_id', $event->id)->findOrFail($itemData['ticket_id']);
                $qty = (int) $itemData['quantity'];

                // Check quota
                if (($ticket->quota - $ticket->sold) < $qty) {
                    return response()->json([
                        'success' => false,
                        'message' => "Kuota tiket '{$ticket->name}' tidak mencukupi.",
                    ], 422);
                }

                $itemSubtotal = $ticket->price * $qty;
                $subtotal += $itemSubtotal;

                // Prepare attendees
                $attendees = $itemData['attendees'] ?? [];

                for ($i = 0; $i < $qty; $i++) {
                  $att = $attendees[$i] ?? [
                      'name'  => $request->buyer_name,
                      'email' => $request->buyer_email,
                      'phone' => $request->buyer_phone,
                  ];

                  $itemsToCreate[] = [
                      'ticket_id'      => $ticket->id,
                      'quantity'       => 1,
                      'price'          => $ticket->price,
                      'attendee_name'  => $att['name'] ?? $request->buyer_name,
                      'attendee_email' => $att['email'] ?? $request->buyer_email,
                      'attendee_phone' => $att['phone'] ?? $request->buyer_phone,
                      'qr_code'        => 'QR-' . strtoupper(\Str::random(12)),
                  ];
                }

                // Increment ticket sold count
                $ticket->increment('sold', $qty);
            }

            $discount = 0;
            $voucherId = null;

            if ($request->filled('voucher_code')) {
                $voucher = \App\Models\Voucher::where('code', strtoupper(trim($request->voucher_code)))->first();
                if ($voucher && $voucher->isValid()) {
                    $discount = $voucher->calculateDiscount($subtotal);
                    $voucherId = $voucher->id;
                    $voucher->increment('used_count');
                }
            }

            $adminFee = 5000; // Flat admin fee Rp 5.000
            $total = max(0, $subtotal + $adminFee - $discount);

            $userId = auth('sanctum')->id();

            $order = Order::create([
                'user_id'        => $userId ?: 1, // Fallback for guest checkout
                'event_id'       => $event->id,
                'tenant_id'      => $event->tenant_id,
                'voucher_id'     => $voucherId,
                'subtotal'       => $subtotal,
                'admin_fee'      => $adminFee,
                'discount'       => $discount,
                'total'          => $total,
                'status'         => 'pending',
                'buyer_name'     => $request->buyer_name,
                'buyer_email'    => $request->buyer_email,
                'buyer_phone'    => $request->buyer_phone,
                'expired_at'     => now()->addHours(2),
            ]);

            foreach ($itemsToCreate as $itemData) {
                $order->items()->create($itemData);
            }

            // Create initial payment record
            $method = $request->payment_method ?? 'qris';
            Payment::create([
                'order_id'    => $order->id,
                'method'      => in_array($method, ['qris', 'bank_transfer', 'ewallet', 'credit_card', 'va']) ? $method : 'qris',
                'provider'    => 'manual',
                'external_id' => 'PAY-' . $order->order_code,
                'amount'      => $total,
                'status'      => 'pending',
                'expired_at'  => $order->expired_at,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibuat.',
                'data'    => $order->load(['event', 'items.ticket', 'payment']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/orders/{code} — Detail order
     */
    public function show(string $code): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->with(['event', 'items.ticket', 'payment'])
            ->where('order_code', $code)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => $order,
        ]);
    }

    /**
     * POST /api/orders/{code}/pay-simulation — Simulasi Pembayaran Instan (Sandbox / Demo)
     */
    public function paySimulation(string $code): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->with(['items.ticket', 'payment'])
            ->where('order_code', $code)
            ->firstOrFail();

        if ($order->status === 'paid') {
            return response()->json([
                'success' => true,
                'message' => 'Order sudah dibayar sebelumnya.',
                'data'    => $order,
            ]);
        }

        DB::beginTransaction();
        try {
            $order->update([
                'status'  => 'paid',
                'paid_at' => now(),
            ]);

            if ($order->payment) {
                $order->payment->update([
                    'status'  => 'success',
                    'paid_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil dikonfirmasi! E-tiket telah terbit.',
                'data'    => $order->fresh(['event', 'items.ticket', 'payment']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengonfirmasi pembayaran: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/orders/{code}/cancel — Batalkan Order
     */
    public function cancel(string $code): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->with('items')
            ->where('order_code', $code)
            ->firstOrFail();

        if ($order->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya order dengan status pending yang dapat dibatalkan.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Restore ticket sold quota
            foreach ($order->items as $item) {
                Ticket::where('id', $item->ticket_id)->decrement('sold', 1);
            }

            $order->update([
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]);

            if ($order->payment) {
                $order->payment->update(['status' => 'failed']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order berhasil dibatalkan.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan order: ' . $e->getMessage(),
            ], 500);
        }
    }
}

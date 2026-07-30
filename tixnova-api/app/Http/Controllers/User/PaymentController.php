<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * POST /api/payments/initiate — Inisiasi payment untuk order
     */
    public function initiate(Request $request): JsonResponse
    {
        $request->validate([
            'order_code' => 'required|string|exists:orders,order_code',
            'method'     => 'required|string|in:qris,bank_transfer,ewallet,credit_card,va',
            'provider'   => 'nullable|string|in:midtrans,xendit,manual',
        ]);

        $order = Order::withoutGlobalScopes()
            ->where('order_code', $request->order_code)
            ->firstOrFail();

        if ($order->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah lunas.',
            ], 400);
        }

        if ($order->status === 'cancelled' || $order->status === 'expired') {
            return response()->json([
                'success' => false,
                'message' => "Pesanan tidak dapat dibayar karena berstatus {$order->status}.",
            ], 400);
        }

        $provider = $request->provider ?? 'midtrans';
        $externalId = 'TRX-' . Str::upper(Str::random(12));
        $paymentUrl = config('app.url') . "/checkout/success?order=" . $order->order_code;

        // Cari atau buat Payment
        $payment = Payment::updateOrCreate(
            ['order_id' => $order->id],
            [
                'method'      => $request->method,
                'provider'    => $provider,
                'external_id' => $externalId,
                'payment_url' => $paymentUrl,
                'amount'      => $order->total,
                'status'      => 'pending',
                'expired_at'  => now()->addHours(24),
            ]
        );

        // Update payment method di Order
        $order->update(['payment_method' => $request->method]);

        return response()->json([
            'success' => true,
            'message' => 'Inisiasi pembayaran berhasil.',
            'data'    => [
                'order_code'   => $order->order_code,
                'external_id'  => $payment->external_id,
                'payment_url'  => $payment->payment_url,
                'amount'       => (float) $payment->amount,
                'method'       => $payment->method,
                'provider'     => $payment->provider,
                'status'       => $payment->status,
                'expired_at'   => $payment->expired_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * GET /api/payments/{order_code}/status — Cek status pembayaran
     */
    public function status(string $order_code): JsonResponse
    {
        $order = Order::withoutGlobalScopes()
            ->where('order_code', $order_code)
            ->with('payment')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => [
                'order_code'   => $order->order_code,
                'order_status' => $order->status,
                'payment'      => $order->payment ? [
                    'external_id' => $order->payment->external_id,
                    'method'      => $order->payment->method,
                    'provider'    => $order->payment->provider,
                    'amount'      => (float) $order->payment->amount,
                    'status'      => $order->payment->status,
                    'paid_at'     => $order->payment->paid_at?->toIso8601String(),
                ] : null,
            ],
        ]);
    }
}

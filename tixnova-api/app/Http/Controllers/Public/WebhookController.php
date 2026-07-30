<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * POST /api/webhooks/midtrans — Handle Callback Midtrans
     */
    public function midtrans(Request $request): JsonResponse
    {
        Log::info('Midtrans Webhook Received:', $request->all());

        $orderCode = $request->input('order_id');
        $transactionStatus = $request->input('transaction_status');
        $fraudStatus = $request->input('fraud_status');

        if (!$orderCode) {
            return response()->json(['message' => 'Invalid payload: order_id is missing'], 400);
        }

        $order = Order::withoutGlobalScopes()->where('order_code', $orderCode)->first();
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $paymentStatus = 'pending';

        if ($transactionStatus === 'capture') {
            $paymentStatus = ($fraudStatus === 'challenge') ? 'pending' : 'success';
        } elseif ($transactionStatus === 'settlement') {
            $paymentStatus = 'success';
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $paymentStatus = ($transactionStatus === 'expire') ? 'expired' : 'failed';
        } elseif ($transactionStatus === 'pending') {
            $paymentStatus = 'pending';
        }

        $this->processPaymentUpdate($order, $paymentStatus, $request->all());

        return response()->json(['status' => 'OK', 'message' => 'Webhook processed']);
    }

    /**
     * POST /api/webhooks/xendit — Handle Callback Xendit
     */
    public function xendit(Request $request): JsonResponse
    {
        Log::info('Xendit Webhook Received:', $request->all());

        $externalId = $request->input('external_id');
        $status = $request->input('status');

        if (!$externalId) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $payment = Payment::where('external_id', $externalId)->first();
        if (!$payment) {
            return response()->json(['message' => 'Payment record not found'], 404);
        }

        $order = Order::withoutGlobalScopes()->find($payment->order_id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $paymentStatus = match ($status) {
            'PAID', 'SETTLED' => 'success',
            'EXPIRED'        => 'expired',
            'FAILED'         => 'failed',
            default          => 'pending',
        };

        $this->processPaymentUpdate($order, $paymentStatus, $request->all());

        return response()->json(['status' => 'OK', 'message' => 'Webhook processed']);
    }

    /**
     * Helper update status payment & order secara atomik
     */
    private function processPaymentUpdate(Order $order, string $paymentStatus, array $rawPayload): void
    {
        DB::transaction(function () use ($order, $paymentStatus, $rawPayload) {
            $payment = Payment::where('order_id', $order->id)->first();

            if ($payment) {
                $payment->update([
                    'status'      => $paymentStatus,
                    'payload_raw' => $rawPayload,
                    'paid_at'     => ($paymentStatus === 'success') ? now() : $payment->paid_at,
                ]);
            }

            if ($paymentStatus === 'success' && $order->status !== 'paid') {
                $order->update([
                    'status'  => 'paid',
                    'paid_at' => now(),
                ]);

                // Increment kuota terjual di tiket
                foreach ($order->items as $item) {
                    Ticket::where('id', $item->ticket_id)->increment('sold', $item->quantity);
                }
            } elseif (in_array($paymentStatus, ['failed', 'expired', 'cancelled']) && $order->status === 'pending') {
                $order->update([
                    'status' => ($paymentStatus === 'expired') ? 'expired' : 'cancelled',
                ]);
            }
        });
    }
}

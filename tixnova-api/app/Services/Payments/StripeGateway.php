<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class StripeGateway
{
    public function createCheckoutSession(Order $order, Payment $payment): array
    {
        $secretKey = config('services.stripe.secret_key');

        if (blank($secretKey)) {
            throw new \RuntimeException('Stripe belum dikonfigurasi.');
        }

        $frontendUrl = rtrim(config('services.stripe.frontend_url', 'http://localhost:3000'), '/');
        $paymentMethodTypes = config('services.stripe.payment_method_types', ['card', 'link']);

        $orderExpiry = $order->expired_at?->isFuture()
            ? (int) $order->expired_at->timestamp
            : now()->addMinutes(15)->timestamp;

        // Stripe requires expires_at >= 30 minutes from creation.
        $expiresAt = (int) max($orderExpiry, now()->addMinutes(30)->timestamp);

        $response = $this->client()->asForm()->post('/v1/checkout/sessions', [
            'payment_method_types' => $paymentMethodTypes,
            'mode' => 'payment',
            'client_reference_id' => $order->order_code,
            'expires_at' => (string) min($expiresAt, now()->addHours(23)->timestamp),
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => 'idr',
                    'unit_amount' => (int) round((float) $order->total),
                    'product_data' => [
                        'name' => mb_substr('Pembelian tiket '.($order->event?->title ?? 'TixNova'), 0, 255),
                    ],
                ],
            ]],
            'metadata' => ['order_code' => $order->order_code],
            'success_url' => $frontendUrl.'/checkout/success?code='.urlencode($order->order_code),
            'cancel_url' => $frontendUrl.'/checkout/failed?order='.urlencode($order->order_code),
        ]);

        $response->throw();

        $data = $response->json();

        if (empty($data['url']) || empty($data['id'])) {
            throw new \RuntimeException('Respons Stripe tidak lengkap.');
        }

        // Keep external_id pointing to the live Checkout Session for status sync.
        $payment->update(['external_id' => $data['id']]);

        return $data;
    }

    public function getCheckoutSessionStatus(Payment $payment): ?array
    {
        if (blank($payment->external_id) || str_starts_with($payment->external_id, $payment->order?->order_code)) {
            return null;
        }

        try {
            $response = $this->client()->get("/v1/checkout/sessions/{$payment->external_id}");
            if ($response->successful()) {
                return $response->json();
            }
        } catch (\Throwable $e) {
            // Ignore connection errors
        }

        return null;
    }

    public function refund(Payment $payment, Refund $refund): array
    {
        if (blank($payment->provider_transaction_id)) {
            throw new \RuntimeException('Payment Intent Stripe tidak tersedia untuk refund otomatis.');
        }

        $response = $this->client()->asForm()->post('/v1/refunds', [
            'payment_intent' => $payment->provider_transaction_id,
            'amount' => (int) round((float) $refund->amount),
            'reason' => 'requested_by_customer',
            'metadata' => ['refund_key' => $refund->provider_refund_key],
        ]);

        $response->throw();

        return $response->json();
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(config('services.stripe.base_url', 'https://api.stripe.com'))
            ->acceptJson()
            ->withToken(config('services.stripe.secret_key'));
    }
}

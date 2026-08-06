<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class XenditGateway
{
    private string $secretKey;

    private string $baseUrl;

    private string $frontendUrl;

    public function __construct(
        ?string $secretKey = null,
        ?string $baseUrl = null,
        ?string $frontendUrl = null,
    ) {
        $this->secretKey = $secretKey ?? (string) config('services.xendit.secret_key', '');
        $this->baseUrl = $baseUrl ?? (string) config('services.xendit.base_url', 'https://api.xendit.co');
        $this->frontendUrl = $frontendUrl ?? (string) config('services.midtrans.frontend_url', 'http://localhost:3000');
    }

    public function createInvoice(Order $order, Payment $payment): array
    {
        $externalId = $payment->external_id ?? 'INV-'.$order->order_code.'-'.Str::random(8);

        $response = Http::withBasicAuth($this->secretKey, '')
            ->timeout(30)
            ->asForm()
            ->post($this->baseUrl.'/v2/invoices', [
                'external_id' => $externalId,
                'amount' => (int) $payment->amount,
                'description' => "Pembayaran untuk {$order->event->title}",
                'invoice_duration' => 86400, // 24 hours
                'customer' => [
                    'given_names' => $order->buyer_name,
                    'email' => $order->buyer_email,
                    'mobile_number' => $order->buyer_phone ?? '',
                ],
                'success_redirect_url' => $this->frontendUrl.'/checkout/success?order='.$order->order_code,
                'failure_redirect_url' => $this->frontendUrl.'/checkout/failed?order='.$order->order_code,
                'items' => $order->items->map(function ($item) {
                    return [
                        'name' => $item->ticket->name,
                        'quantity' => $item->quantity,
                        'price' => (int) $item->price,
                        'category' => 'Event Ticket',
                    ];
                })->toArray(),
            ]);

        return $this->handleResponse($response);
    }

    public function getInvoice(string $externalId): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->timeout(30)
            ->get($this->baseUrl.'/v2/invoices/'.$externalId);

        return $this->handleResponse($response);
    }

    public function handleCallback(array $data): array
    {
        $status = match ($data['status'] ?? '') {
            'PAID' => 'success',
            'EXPIRED' => 'expired',
            'PENDING' => 'pending',
            default => 'failed',
        };

        return [
            'external_id' => $data['external_id'] ?? '',
            'status' => $status,
            'amount' => $data['amount'] ?? 0,
            'paid_at' => $data['paid_at'] ?? null,
            'payment_method' => $data['payment_method'] ?? null,
            'payment_channel' => $data['payment_channel'] ?? null,
            'raw' => $data,
        ];
    }

    public function refund(Payment $payment, float $amount): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->timeout(30)
            ->asForm()
            ->post($this->baseUrl.'/v2/invoices/'.$payment->external_id.'/refunds', [
                'amount' => (int) $amount,
            ]);

        return $this->handleResponse($response);
    }

    private function handleResponse(Response $response): array
    {
        if ($response->failed()) {
            throw new \RuntimeException(
                'Xendit API error: '.$response->body(),
                $response->status()
            );
        }

        return $response->json();
    }
}

<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Refund;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class MidtransGateway
{
    public function createTransaction(Order $order, Payment $payment): array
    {
        $serverKey = config('services.midtrans.server_key');

        if (blank($serverKey)) {
            throw new \RuntimeException('Midtrans belum dikonfigurasi.');
        }

        $response = $this->snapClient()
            ->post('/snap/v1/transactions', [
                'transaction_details' => [
                    'order_id' => $payment->external_id,
                    'gross_amount' => (int) round((float) $order->total),
                ],
                'customer_details' => [
                    'first_name' => mb_substr($order->buyer_name ?: 'Pembeli TixNova', 0, 50),
                    'email' => $order->buyer_email,
                    'phone' => preg_replace('/[^0-9+]/', '', $order->buyer_phone) ?: '081234567890',
                ],
                'item_details' => [[
                    'id' => $order->order_code,
                    'price' => (int) round((float) $order->total),
                    'quantity' => 1,
                    'name' => 'Pembelian tiket TixNova',
                ]],
                'expiry' => [
                    'unit' => 'minute',
                    'duration' => (int) max(1, round(now()->diffInMinutes($order->expired_at, false))),
                ],
                'callbacks' => [
                    'finish' => rtrim(config('services.midtrans.frontend_url'), '/').'/checkout/success?code='.urlencode($order->order_code),
                ],
            ]);

        $response->throw();

        $data = $response->json();

        if (empty($data['redirect_url']) || empty($data['token'])) {
            throw new \RuntimeException('Respons Midtrans tidak lengkap.');
        }

        return $data;
    }

    public function getTransactionStatus(Payment $payment): ?array
    {
        $ids = array_filter([
            $payment->external_id,
            $payment->order?->order_code,
        ]);

        foreach ($ids as $id) {
            if (blank($id)) {
                continue;
            }

            try {
                $response = $this->client()->get("/v2/{$id}/status");
                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Throwable $e) {
                // Ignore connection errors
            }
        }

        return null;
    }

    public function refund(Payment $payment, Refund $refund): array
    {
        if (blank($payment->provider_transaction_id)) {
            throw new \RuntimeException('ID transaksi Midtrans tidak tersedia untuk refund otomatis.');
        }

        $response = $this->client()
            ->post("/v2/{$payment->provider_transaction_id}/refund", [
                'refund_key' => $refund->provider_refund_key,
                'amount' => (int) round((float) $refund->amount),
                'reason' => mb_substr($refund->reason, 0, 255),
            ]);

        $response->throw();

        return $response->json();
    }

    private function snapClient(): PendingRequest
    {
        return Http::baseUrl(config('services.midtrans.snap_base_url'))
            ->acceptJson()
            ->asJson()
            ->withBasicAuth(config('services.midtrans.server_key'), '');
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(config('services.midtrans.base_url'))
            ->acceptJson()
            ->asJson()
            ->withBasicAuth(config('services.midtrans.server_key'), '');
    }
}

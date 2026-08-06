<?php

namespace App\Services;

use App\Models\Order;
use App\Models\WebhookDelivery;
use App\Models\WebhookSubscription;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class WebhookService
{
    public function dispatchOrder(Order $order, string $eventType): void
    {
        $payload = [
            'id' => (string) $order->id,
            'event_type' => $eventType,
            'created_at' => now()->toIso8601String(),
            'data' => [
                'order_id' => (string) $order->id,
                'order_code' => $order->order_code ?? null,
                'event_id' => (string) $order->event_id,
                'tenant_id' => (string) $order->tenant_id,
                'user_id' => (string) $order->user_id,
                'total' => $order->total,
                'status' => $order->status,
            ],
        ];

        $subscriptions = WebhookSubscription::withoutTenantScope()
            ->where('tenant_id', $order->tenant_id)
            ->where('event_type', $eventType)
            ->where('is_active', true)
            ->get();

        foreach ($subscriptions as $subscription) {
            $this->deliver($subscription, $eventType, $payload);
        }
    }

    public function deliver(WebhookSubscription $subscription, string $eventType, array $payload): WebhookDelivery
    {
        $delivery = WebhookDelivery::create([
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'event_type' => $eventType,
            'payload' => $payload,
            'status' => WebhookDelivery::STATUS_PENDING,
        ]);

        try {
            $body = json_encode($payload);
            $signature = $subscription->signing_secret
                ? hash_hmac('sha256', $body, $subscription->signing_secret)
                : null;

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'User-Agent' => 'TixNova-Webhook/1.0',
                    'X-TixNova-Event' => $eventType,
                    'X-TixNova-Delivery' => (string) $delivery->id,
                    'X-TixNova-Signature' => $signature ? "sha256={$signature}" : null,
                ])
                ->post($subscription->target_url, $payload);

            $delivery->update([
                'status' => $response->successful() ? WebhookDelivery::STATUS_SENT : WebhookDelivery::STATUS_FAILED,
                'response_code' => (string) $response->status(),
                'error' => $response->successful() ? null : substr($response->body(), 0, 500),
            ]);
        } catch (ConnectionException $e) {
            $delivery->update([
                'status' => WebhookDelivery::STATUS_FAILED,
                'error' => 'Connection error: '.substr($e->getMessage(), 0, 500),
            ]);
        }

        return $delivery;
    }
}

<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\WebhookDelivery;
use App\Models\WebhookSubscription;
use App\Services\WebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiPlatformController extends Controller
{
    public function __construct(private WebhookService $webhooks) {}

    public function apiKeys(): JsonResponse
    {
        $keys = ApiKey::query()
            ->orderByDesc('id')
            ->get()
            ->map(fn (ApiKey $key) => [
                'id' => $key->id,
                'name' => $key->name,
                'prefix' => $key->prefix,
                'scopes' => $key->scopes,
                'is_active' => $key->is_active,
                'expires_at' => $key->expires_at?->toIso8601String(),
                'last_used_at' => $key->last_used_at?->toIso8601String(),
                'created_at' => $key->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'success' => true,
            'data' => $keys,
        ]);
    }

    public function apiKeyStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'scopes' => ['sometimes', 'array'],
            'scopes.*' => ['string', 'in:read,write'],
        ]);

        $raw = 'tn_live_'.Str::random(40);
        $scopes = count($data['scopes'] ?? []) > 0 ? implode(',', array_unique($data['scopes'])) : ApiKey::SCOPE_READ;

        $key = ApiKey::create([
            'name' => $data['name'],
            'prefix' => substr($raw, 0, 14),
            'key_hash' => hash('sha256', $raw),
            'scopes' => $scopes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'API key dibuat. Simpan segera, hanya ditampilkan sekali.',
            'data' => [
                'id' => $key->id,
                'name' => $key->name,
                'prefix' => $key->prefix,
                'scopes' => $key->scopes,
                'key' => $raw,
            ],
        ], 201);
    }

    public function apiKeyRevoke(ApiKey $apiKey): JsonResponse
    {
        $apiKey->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'API key dinonaktifkan.',
            'data' => ['id' => $apiKey->id, 'is_active' => false],
        ]);
    }

    public function apiKeyDestroy(ApiKey $apiKey): JsonResponse
    {
        $apiKey->delete();

        return response()->json([
            'success' => true,
            'message' => 'API key dihapus.',
        ]);
    }

    public function webhooks(): JsonResponse
    {
        $subscriptions = WebhookSubscription::query()
            ->withCount('deliveries')
            ->withCount(['deliveries as failed_deliveries' => fn ($q) => $q->where('status', WebhookDelivery::STATUS_FAILED)])
            ->orderByDesc('id')
            ->get()
            ->map(fn (WebhookSubscription $sub) => [
                'id' => $sub->id,
                'name' => $sub->name,
                'event_type' => $sub->event_type,
                'target_url' => $sub->target_url,
                'is_active' => $sub->is_active,
                'has_secret' => ! is_null($sub->signing_secret),
                'deliveries_count' => $sub->deliveries_count,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'event_types' => WebhookSubscription::eventTypes(),
                'subscriptions' => $subscriptions,
            ],
        ]);
    }

    public function webhookStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:150'],
            'event_type' => ['required', 'string', 'in:'.implode(',', WebhookSubscription::eventTypes())],
            'target_url' => ['required', 'string', 'url', 'max:500'],
        ]);

        $subscription = WebhookSubscription::create([
            ...$data,
            'signing_secret' => Str::random(32),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Webhook endpoint terdaftar.',
            'data' => [
                'id' => $subscription->id,
                'event_type' => $subscription->event_type,
                'target_url' => $subscription->target_url,
                'signing_secret' => $subscription->signing_secret,
            ],
        ], 201);
    }

    public function webhookTest(WebhookSubscription $subscription): JsonResponse
    {
        $delivery = $this->webhooks->deliver($subscription, 'test.ping', [
            'event_type' => 'test.ping',
            'message' => 'Ping dari TixNova.',
            'timestamp' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $delivery->status === WebhookDelivery::STATUS_SENT ? 'Ping terkirim.' : 'Ping gagal.',
            'data' => $delivery,
        ]);
    }

    public function webhookDestroy(WebhookSubscription $subscription): JsonResponse
    {
        $subscription->delete();

        return response()->json([
            'success' => true,
            'message' => 'Webhook endpoint dihapus.',
        ]);
    }

    public function deliveries(Request $request): JsonResponse
    {
        $deliveries = WebhookDelivery::query()
            ->with('subscription:id,name,event_type,target_url')
            ->orderByDesc('id')
            ->limit(min(50, max(1, $request->integer('limit', 25))))
            ->get();

        return response()->json([
            'success' => true,
            'data' => $deliveries,
        ]);
    }
}

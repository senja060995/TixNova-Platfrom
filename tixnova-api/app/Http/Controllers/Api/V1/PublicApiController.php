<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\WebhookSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PublicApiController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');

        $events = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'approved')
            ->when($request->filled('city'), fn ($q) => $q->where('city', $request->string('city')->toString()))
            ->when($request->boolean('upcoming'), fn ($q) => $q->where('start_date', '>=', now()))
            ->orderBy('start_date')
            ->paginate($request->integer('per_page', 20) > 50 ? 50 : $request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $events->through(fn (Event $event) => $this->eventPayload($event)),
        ]);
    }

    public function show(Request $request, string $identifier): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');
        $event = $this->resolveEvent($tenant->id, $identifier);

        if (! $event) {
            return response()->json(['success' => false, 'message' => 'Event tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->eventPayload($event, withTickets: true),
        ]);
    }

    public function widget(Request $request, string $identifier): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');
        $event = $this->resolveEvent($tenant->id, $identifier);

        if (! $event) {
            return response()->json(['success' => false, 'message' => 'Event tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'event' => $this->eventPayload($event, withTickets: true),
                'embed' => [
                    'script' => '/embed.js',
                    'iframe_url' => "https://example.com/embed/{$event->slug}",
                    'code' => "<div class=\"tixnova-widget\" data-event=\"{$event->slug}\"></div>\n<script src=\"/embed.js\" async></script>",
                ],
            ],
        ]);
    }

    public function orders(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');

        $orders = Order::withoutGlobalScopes()
            ->with('event:id,title,slug')
            ->where('tenant_id', $tenant->id)
            ->when($request->filled('event_id'), fn ($q) => $q->where('event_id', $request->integer('event_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')))
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 20) > 50 ? 50 : $request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function order(Request $request, int $id): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');

        $order = Order::withoutGlobalScopes()
            ->with(['event:id,title,slug', 'items.ticket'])
            ->where('tenant_id', $tenant->id)
            ->find($id);

        if (! $order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    public function webhooks(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');

        return response()->json([
            'success' => true,
            'data' => WebhookSubscription::withoutTenantScope()
                ->where('tenant_id', $tenant->id)
                ->orderByDesc('id')
                ->get()
                ->makeHidden('signing_secret'),
        ]);
    }

    public function webhookStore(Request $request): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:150'],
            'event_type' => ['required', 'string', 'in:'.implode(',', WebhookSubscription::eventTypes())],
            'target_url' => ['required', 'string', 'url', 'max:500'],
        ]);

        $subscription = WebhookSubscription::create([
            ...$data,
            'tenant_id' => $tenant->id,
            'signing_secret' => Str::random(32),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Webhook endpoint terdaftar.',
            'data' => $subscription->makeHidden('signing_secret'),
        ], 201);
    }

    public function webhookDestroy(Request $request, int $id): JsonResponse
    {
        $tenant = $request->attributes->get('api_tenant');

        $subscription = WebhookSubscription::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->find($id);

        if (! $subscription) {
            return response()->json(['success' => false, 'message' => 'Webhook tidak ditemukan.'], 404);
        }

        $subscription->delete();

        return response()->json([
            'success' => true,
            'message' => 'Webhook endpoint dihapus.',
        ]);
    }

    private function resolveEvent(int $tenantId, string $identifier): ?Event
    {
        return Event::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('status', 'approved')
            ->when(is_numeric($identifier), fn ($q) => $q->where('id', (int) $identifier), fn ($q) => $q->where('slug', $identifier))
            ->first();
    }

    private function eventPayload(Event $event, bool $withTickets = false): array
    {
        $payload = [
            'id' => $event->id,
            'title' => $event->title,
            'slug' => $event->slug,
            'category' => $event->category?->name,
            'description' => $event->description,
            'venue' => $event->venue,
            'city' => $event->city,
            'province' => $event->province,
            'start_date' => $event->start_date?->toIso8601String(),
            'end_date' => $event->end_date?->toIso8601String(),
            'banner' => $event->banner,
            'status' => $event->status,
        ];

        if ($withTickets) {
            $payload['tickets'] = $event->tickets->map(fn ($ticket) => [
                'id' => $ticket->id,
                'name' => $ticket->name,
                'description' => $ticket->description,
                'price' => (float) $ticket->price,
                'quota' => (int) $ticket->quota,
                'sold' => (int) $ticket->sold,
                'available' => max(0, (int) $ticket->quota - (int) $ticket->sold),
                'sort_order' => (int) $ticket->sort_order,
            ])->values();
        }

        return $payload;
    }
}

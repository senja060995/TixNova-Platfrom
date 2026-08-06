<?php

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Models\WebhookSubscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ApiPlatformTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_create_list_revoke_and_delete_api_keys(): void
    {
        [$tenant, $promotor, $category] = $this->context('key');
        $this->event($tenant, $promotor, $category, 10, 'key-event');

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/api-keys', ['name' => 'Web Shop', 'scopes' => ['read', 'write']])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id', 'key', 'prefix']]);

        $response = $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/api-keys', ['name' => 'Web Shop', 'scopes' => ['read', 'write']]);
        $rawKey = $response->json('data.key');
        $key = ApiKey::latest('id')->first();
        $this->assertNotEquals($rawKey, $key->key_hash);
        $this->assertEquals(hash('sha256', $rawKey), $key->key_hash);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/api-keys')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.prefix', substr($rawKey, 0, 14));

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/api-keys/{$key->id}/revoke")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse($key->fresh()->is_active);
    }

    public function test_promotor_can_fetch_webhooks_and_deliveries(): void
    {
        [$tenant, $promotor, $category] = $this->context('wh-fetch');

        $sub = WebhookSubscription::create([
            'tenant_id' => $tenant->id,
            'name' => 'My Webhook',
            'event_type' => 'order.paid',
            'target_url' => 'https://example.com/webhook',
            'signing_secret' => 'secret123',
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/webhooks')
            ->assertOk()
            ->assertJsonPath('data.subscriptions.0.id', $sub->id);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/webhooks/deliveries')
            ->assertOk();
    }

    public function test_public_api_lists_and_serves_only_own_tenant_events(): void
    {
        [$tenant, $promotor, $category] = $this->context('pub-a');
        $event = $this->event($tenant, $promotor, $category, 5, 'pub-a-event');
        $ticket = $event->tickets()->first();

        [$otherTenant, $otherPromotor, $otherCategory] = $this->context('pub-b');
        $otherEvent = $this->event($otherTenant, $otherPromotor, $otherCategory, 5, 'pub-b-event');

        $key = ApiKey::create([
            'tenant_id' => $tenant->id,
            'name' => 'Integration',
            'prefix' => 'tn_live_abcd',
            'key_hash' => hash('sha256', 'test_secret_key_123'),
            'scopes' => 'read,write',
        ]);

        $this->getJson('/api/v1/events', ['Authorization' => 'Bearer test_secret_key_123'])
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.slug', 'pub-a-event');

        $this->getJson("/api/v1/events/{$event->slug}", ['Authorization' => 'Bearer test_secret_key_123'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Event pub-a-event')
            ->assertJsonCount(1, 'data.tickets')
            ->assertJsonPath('data.tickets.0.name', 'Regular');

        $this->getJson("/api/v1/events/{$otherEvent->id}", ['Authorization' => 'Bearer test_secret_key_123'])
            ->assertNotFound();

        $this->getJson("/api/v1/events/{$event->slug}/widget", ['Authorization' => 'Bearer test_secret_key_123'])
            ->assertOk()
            ->assertJsonPath('data.embed.code', fn ($code) => str_contains($code, 'tixnova-widget'));

        $this->getJson('/api/v1/events', ['Authorization' => 'Bearer invalid_key'])
            ->assertStatus(401);
    }

    public function test_public_api_orders_scoped_to_tenant(): void
    {
        [$tenant, $promotor, $category] = $this->context('ord');
        $event = $this->event($tenant, $promotor, $category, 5, 'ord-event');
        $buyer = User::factory()->create();
        $order = $this->paidOrder($event, $buyer);

        $key = ApiKey::create([
            'tenant_id' => $tenant->id,
            'name' => 'Orders',
            'prefix' => 'tn_live_ord1',
            'key_hash' => hash('sha256', 'secret_orders_key'),
            'scopes' => 'read',
        ]);

        $this->getJson('/api/v1/orders', ['Authorization' => 'Bearer secret_orders_key'])
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.id', $order->id);

        $this->getJson("/api/v1/orders/{$order->id}", ['Authorization' => 'Bearer secret_orders_key'])
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->getJson('/api/v1/orders/99999', ['Authorization' => 'Bearer secret_orders_key'])
            ->assertNotFound();
    }

    public function test_webhook_subscription_and_delivery_on_order_paid(): void
    {
        [$tenant, $promotor, $category] = $this->context('wh');
        $event = $this->event($tenant, $promotor, $category, 5, 'wh-event');
        $buyer = User::factory()->create();

        $key = ApiKey::create([
            'tenant_id' => $tenant->id,
            'name' => 'Webhooks',
            'prefix' => 'tn_live_wh00',
            'key_hash' => hash('sha256', 'secret_wh_key'),
            'scopes' => 'read,write',
        ]);

        Http::fake([
            'https://partner.test/hook' => Http::response('ok', 200),
        ]);

        $this->postJson('/api/v1/webhooks', [
            'name' => 'Partner API',
            'event_type' => 'order.paid',
            'target_url' => 'https://partner.test/hook',
        ], ['Authorization' => 'Bearer secret_wh_key'])
            ->assertCreated()
            ->assertJsonPath('data.event_type', 'order.paid');

        $subscription = WebhookSubscription::first();
        $this->assertNotNull($subscription->signing_secret);

        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 100000,
            'admin_fee' => 0,
            'commission_fee' => 0,
            'total' => 100000,
            'status' => 'pending',
        ]);
        $order->update(['status' => 'paid']);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://partner.test/hook'
                && $request->hasHeader('X-TixNova-Event', 'order.paid');
        });

        $this->assertDatabaseHas('webhook_deliveries', [
            'subscription_id' => $subscription->id,
            'event_type' => 'order.paid',
            'status' => 'sent',
            'response_code' => '200',
        ]);
    }

    public function test_write_endpoint_rejected_for_read_only_key(): void
    {
        [$tenant, $promotor, $category] = $this->context('scope');
        $this->event($tenant, $promotor, $category, 5, 'scope-event');

        $key = ApiKey::create([
            'tenant_id' => $tenant->id,
            'name' => 'Read Only',
            'prefix' => 'tn_live_read',
            'key_hash' => hash('sha256', 'secret_read_only'),
            'scopes' => 'read',
        ]);

        $this->postJson('/api/v1/webhooks', [
            'event_type' => 'order.paid',
            'target_url' => 'https://x.test/hook',
        ], ['Authorization' => 'Bearer secret_read_only'])
            ->assertStatus(403);
    }

    private function context(string $suffix): array
    {
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');
        $category = Category::create([
            'name' => 'Konser',
            'slug' => 'konser-'.$suffix,
            'type' => 'event',
            'is_active' => true,
        ]);

        return [$tenant, $promotor, $category];
    }

    private function event(Tenant $tenant, User $promotor, Category $category, int $daysToEvent, string $slug): Event
    {
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'category_id' => $category->id,
            'title' => 'Event '.$slug,
            'slug' => $slug,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addDays($daysToEvent),
            'end_date' => now()->addDays($daysToEvent)->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 100]);

        return $event;
    }

    private function paidOrder(Event $event, User $buyer): Order
    {
        $ticket = $event->tickets()->first();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $event->tenant_id,
            'subtotal' => 100000,
            'admin_fee' => 0,
            'commission_fee' => 0,
            'total' => 100000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'ticket_id' => $ticket->id,
            'quantity' => 1,
            'price' => 100000,
            'qr_code' => 'QRAPI'.str()->upper(str()->random(10)),
        ]);

        return $order;
    }
}

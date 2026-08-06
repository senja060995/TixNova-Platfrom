<?php

namespace Tests\Feature;

use App\Models\Campaign;
use App\Models\Event;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CampaignOSTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_create_and_activate_campaign(): void
    {
        [$tenant, $promotor] = $this->tenantContext();

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/campaigns', [
                'name' => 'Ramadan Promo',
                'description' => 'Diskon awal tahun',
                'budget' => 10000000,
                'valid_until' => now()->addMonth()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Ramadan Promo');

        $campaign = Campaign::withoutTenantScope()->where('name', 'Ramadan Promo')->first();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/campaigns/{$campaign->id}/activate")
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
    }

    public function test_voucher_in_active_campaign_is_valid(): void
    {
        [$tenant, $promotor] = $this->tenantContext();
        $campaign = Campaign::create([
            'tenant_id' => $tenant->id,
            'name' => 'Promo Aktif',
            'status' => 'active',
        ]);
        $voucher = Voucher::create([
            'tenant_id' => $tenant->id,
            'campaign_id' => $campaign->id,
            'code' => 'CAMPAKTIF',
            'type' => 'public',
            'discount_type' => 'percentage',
            'discount_value' => 10,
        ]);

        $this->assertTrue($voucher->fresh()->isValid());

        $this->postJson('/api/vouchers/apply', ['code' => 'CAMPAKTIF', 'subtotal' => 100000])
            ->assertOk()
            ->assertJsonPath('data.discount', 10000);
    }

    public function test_voucher_in_ended_or_draft_campaign_is_invalid(): void
    {
        [$tenant, $promotor] = $this->tenantContext();
        $ended = Campaign::create(['tenant_id' => $tenant->id, 'name' => 'Selesai', 'status' => 'ended']);
        $draft = Campaign::create(['tenant_id' => $tenant->id, 'name' => 'Draft', 'status' => 'draft']);

        Voucher::create([
            'tenant_id' => $tenant->id, 'campaign_id' => $ended->id,
            'code' => 'CAMSELESAI', 'type' => 'public',
            'discount_type' => 'fixed', 'discount_value' => 5000,
        ]);
        Voucher::create([
            'tenant_id' => $tenant->id, 'campaign_id' => $draft->id,
            'code' => 'CAMDRAFT', 'type' => 'public',
            'discount_type' => 'fixed', 'discount_value' => 5000,
        ]);

        $this->postJson('/api/vouchers/apply', ['code' => 'CAMSELESAI', 'subtotal' => 100000])->assertStatus(422);
        $this->postJson('/api/vouchers/apply', ['code' => 'CAMDRAFT', 'subtotal' => 100000])->assertStatus(422);
    }

    public function test_early_bird_price_applied_in_checkout(): void
    {
        [$tenant, $promotor, $event, $ticket] = $this->eventContext();
        $ticket->update(['price' => 100000, 'early_bird_price' => 80000, 'early_bird_quota' => 5]);
        $buyer = User::factory()->create();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/orders', $this->orderPayload($event->id, $ticket->id))
            ->assertCreated();

        $order = Order::withoutTenantScope()->latest('id')->first();
        $this->assertEquals(80000, (float) $order->subtotal);
        $this->assertEquals(80000, (float) $order->items()->first()->price);
    }

    public function test_early_bird_stops_when_quota_exhausted(): void
    {
        [$tenant, $promotor, $event, $ticket] = $this->eventContext();
        $ticket->update(['price' => 100000, 'early_bird_price' => 80000, 'early_bird_quota' => 1]);
        $ticket->update(['reserved' => 1]);

        $buyer = User::factory()->create();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/orders', $this->orderPayload($event->id, $ticket->id))
            ->assertCreated();

        $order = Order::withoutTenantScope()->latest('id')->first();
        $this->assertEquals(100000, (float) $order->subtotal);
    }

    public function test_early_bird_inactive_after_end_date(): void
    {
        [$tenant, $promotor, $event, $ticket] = $this->eventContext();
        $ticket->update([
            'price' => 100000,
            'early_bird_price' => 80000,
            'early_bird_end' => now()->subDay(),
        ]);

        $this->assertFalse($ticket->fresh()->earlyBirdActive());
        $this->assertEquals(100000, $ticket->fresh()->currentPrice());
    }

    public function test_promotor_can_set_early_bird_via_ticket_update(): void
    {
        [$tenant, $promotor, $event, $ticket] = $this->eventContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/tickets/{$ticket->id}", [
                'early_bird_price' => 75000,
                'early_bird_quota' => 3,
            ])
            ->assertOk();

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'early_bird_price' => 75000,
            'early_bird_quota' => 3,
        ]);
    }

    private function tenantContext(): array
    {
        $suffix = str()->lower(str()->random(8));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        return [$tenant, $promotor];
    }

    private function eventContext(): array
    {
        [$tenant, $promotor] = $this->tenantContext();
        $suffix = str()->lower(str()->random(8));
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'title' => 'Event '.$suffix,
            'slug' => 'event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        $ticket = Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        return [$tenant, $promotor, $event, $ticket];
    }

    private function orderPayload(int $eventId, int $ticketId): array
    {
        return [
            'event_id' => $eventId,
            'items' => [
                ['ticket_id' => $ticketId, 'quantity' => 1],
            ],
            'payment_method' => 'qris',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
        ];
    }
}

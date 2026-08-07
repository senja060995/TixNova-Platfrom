<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Community;
use App\Models\CommunityEvent;
use App\Models\CommunityMember;
use App\Models\CommunityPayout;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CommunityTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_create_list_update_delete_community(): void
    {
        [$tenant, , $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/communities', [
                'name' => 'Fans Club Event',
                'type' => 'fan_club',
                'description' => 'Komunitas fans',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Fans Club Event')
            ->assertJsonPath('data.type', 'fan_club');

        $id = $response = $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/communities')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->json('data.0.slug');

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/communities/{$id}", ['name' => 'Fans Club Baru'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Fans Club Baru');

        $this->actingAs($promotor, 'sanctum')
            ->deleteJson("/api/promotor/communities/{$id}")
            ->assertOk();

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/communities')
            ->assertJsonCount(0, 'data');
    }

    public function test_promotor_can_manage_community_events_and_share(): void
    {
        [$tenant, $event, $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => strtoupper(str()->random(6)),
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/communities/{$community->slug}/events", [
                'event_id' => $event->id,
                'revenue_share_pct' => 15.00,
            ])
            ->assertCreated()
            ->assertJsonPath('data.revenue_share_pct', '15.00');

        $ce = CommunityEvent::first();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/communities/{$community->slug}/events/{$ce->id}", [
                'revenue_share_pct' => 20.00,
            ])
            ->assertOk()
            ->assertJsonPath('data.revenue_share_pct', '20.00');

        $this->actingAs($promotor, 'sanctum')
            ->deleteJson("/api/promotor/communities/{$community->slug}/events/{$ce->id}")
            ->assertOk();

        $this->assertDatabaseMissing('community_events', ['id' => $ce->id]);
    }

    public function test_checkout_with_community_code_creates_payout_on_paid(): void
    {
        [$tenant, $event, $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        CommunityEvent::create([
            'community_id' => $community->id,
            'event_id' => $event->id,
            'revenue_share_pct' => 10.00,
        ]);

        $buyer = User::factory()->create();

        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'commission_fee' => 5000,
            'discount' => 0,
            'total' => 105000,
            'status' => 'pending',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'community_code' => 'COMMUNITY',
        ]);
        $order->items()->create(['ticket_id' => $event->tickets()->first()->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);

        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $payout = CommunityPayout::where('order_id', $order->id)->first();

        $this->assertNotNull($payout);
        $this->assertEquals('earned', $payout->status);
        $this->assertEquals(10.00, $payout->share_pct);
        $this->assertEquals(10000.00, (float) $payout->amount);
        $this->assertEquals($tenant->id, $payout->tenant_id);
        $this->assertEquals($community->id, $payout->community_id);

        $member = CommunityMember::where('community_id', $community->id)
            ->where('user_id', $buyer->id)
            ->first();
        $this->assertNotNull($member);
    }

    public function test_refund_reverses_community_payout(): void
    {
        [$tenant, $event, $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        CommunityEvent::create([
            'community_id' => $community->id,
            'event_id' => $event->id,
            'revenue_share_pct' => 10.00,
        ]);

        $buyer = User::factory()->create();

        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'commission_fee' => 5000,
            'discount' => 0,
            'total' => 105000,
            'status' => 'pending',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'community_code' => 'COMMUNITY',
        ]);
        $order->items()->create(['ticket_id' => $event->tickets()->first()->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);

        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $payout = CommunityPayout::where('order_id', $order->id)->first();
        $this->assertNotNull($payout);

        $order->update(['status' => 'refunded']);

        $this->assertDatabaseHas('community_payouts', [
            'id' => $payout->id,
            'status' => 'reversed',
        ]);
    }

    public function test_community_payout_is_idempotent(): void
    {
        [$tenant, $event, $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        CommunityEvent::create([
            'community_id' => $community->id,
            'event_id' => $event->id,
            'revenue_share_pct' => 10.00,
        ]);

        $buyer = User::factory()->create();

        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'commission_fee' => 5000,
            'discount' => 0,
            'total' => 105000,
            'status' => 'pending',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'community_code' => 'COMMUNITY',
        ]);
        $order->items()->create(['ticket_id' => $event->tickets()->first()->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);

        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $payoutCount = CommunityPayout::where('order_id', $order->id)->count();
        $this->assertEquals(1, $payoutCount);
    }

    public function test_user_can_join_and_leave_community(): void
    {
        [$tenant, , $promotor] = $this->context();
        $buyer = User::factory()->create();

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/communities/{$community->slug}/join")
            ->assertCreated();

        $this->assertDatabaseHas('community_members', [
            'community_id' => $community->id,
            'user_id' => $buyer->id,
            'role' => 'member',
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/communities/{$community->slug}/leave")
            ->assertOk();

        $this->assertDatabaseMissing('community_members', [
            'community_id' => $community->id,
            'user_id' => $buyer->id,
        ]);
    }

    public function test_promotor_can_get_community_members(): void
    {
        [$tenant, , $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        $buyer = User::factory()->create();
        CommunityMember::create([
            'community_id' => $community->id,
            'user_id' => $buyer->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/communities/{$community->slug}/members");

        $response->assertOk();
        $response->assertJsonCount(1, 'data.data');
        $response->assertJsonPath('data.data.0.user_id', $buyer->id);
    }

    public function test_user_can_list_their_communities(): void
    {
        [$tenant, , $promotor] = $this->context();
        $buyer = User::factory()->create();

        $joined = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Joined',
            'slug' => 'joined-'.str()->lower(str()->random(6)),
            'code' => 'JOINED',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        $other = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Other',
            'slug' => 'other-'.str()->lower(str()->random(6)),
            'code' => 'OTHER',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        CommunityMember::create([
            'community_id' => $joined->id,
            'user_id' => $buyer->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/me/communities');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.id', $joined->id);
        $response->assertJsonMissing(['id' => $other->id]);
    }

    public function test_show_includes_is_member_for_authenticated_user(): void
    {
        [$tenant, , $promotor] = $this->context();
        $buyer = User::factory()->create();

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->getJson("/api/communities/{$community->slug}")
            ->assertOk()
            ->assertJsonPath('data.is_member', false);

        CommunityMember::create([
            'community_id' => $community->id,
            'user_id' => $buyer->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        $this->actingAs($buyer, 'sanctum')
            ->getJson("/api/communities/{$community->slug}")
            ->assertOk()
            ->assertJsonPath('data.is_member', true);
    }

    public function test_foreign_community_cannot_be_accessed_by_promotor(): void
    {
        [$tenant, , $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $otherTenant = Tenant::create([
            'name' => 'Other',
            'slug' => 'other-'.str()->lower(str()->random(6)),
            'email' => 'other@example.test',
            'status' => 'active',
        ]);

        $foreignCommunity = Community::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Foreign',
            'slug' => 'foreign-'.str()->lower(str()->random(6)),
            'code' => 'FOREIGN',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/communities/{$foreignCommunity->slug}")
            ->assertNotFound();
    }

    public function test_promotor_can_get_community_summary(): void
    {
        [$tenant, $event, $promotor] = $this->context();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $community = Community::create([
            'tenant_id' => $tenant->id,
            'name' => 'Komunitas',
            'slug' => 'komunitas-'.str()->lower(str()->random(6)),
            'code' => 'COMMUNITY',
            'type' => 'komunitas',
            'status' => 'active',
        ]);

        CommunityEvent::create([
            'community_id' => $community->id,
            'event_id' => $event->id,
            'revenue_share_pct' => 10.00,
        ]);

        $buyer = User::factory()->create();

        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'commission_fee' => 5000,
            'discount' => 0,
            'total' => 105000,
            'status' => 'pending',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'community_code' => 'COMMUNITY',
        ]);
        $order->items()->create(['ticket_id' => $event->tickets()->first()->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);

        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $response = $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/communities/{$community->slug}/summary");

        $response->assertOk();
        $response->assertJsonPath('data.member_count', 1);
        $response->assertJsonPath('data.events_count', 1);
        $response->assertJsonPath('data.total_share_earned', 10000);
        $response->assertJsonPath('data.orders_count', 1);
    }

    private function context(): array
    {
        $suffix = str()->lower(str()->random(8));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        $category = Category::create([
            'name' => 'Konser',
            'slug' => 'konser',
            'type' => 'event',
            'is_active' => true,
        ]);
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'category_id' => $category->id,
            'title' => 'Event '.$suffix,
            'slug' => 'event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        return [$tenant, $event, $promotor];
    }
}

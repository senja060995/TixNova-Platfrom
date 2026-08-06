<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ScanLog;
use App\Models\Sponsor;
use App\Models\Sponsorship;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SponsorTest extends TestCase
{
    use RefreshDatabase;

    public function test_sponsor_crud_and_summary(): void
    {
        [$tenant, $promotor, $category] = $this->context('sponsor');
        $event = $this->event($tenant, $promotor, $category, 10, 'sponsor-event');

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/sponsors', [
                'name' => 'Kopi Nusantara',
                'website' => 'https://kopi.test',
                'industry' => 'F&B',
                'contact_email' => 'ops@kopi.test',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Kopi Nusantara');

        $sponsor = Sponsor::first();
        $this->assertNotNull($sponsor->slug);

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/sponsors/{$sponsor->id}", ['industry' => 'Beverage'])
            ->assertOk()
            ->assertJsonPath('data.industry', 'Beverage');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/sponsors')
            ->assertOk()
            ->assertJsonPath('data.summary.total_sponsors', 1);

        $event->sponsorships()->create([
            'tenant_id' => $tenant->id,
            'sponsor_id' => $sponsor->id,
            'amount' => 25000000,
            'poa_threshold_pct' => 80,
            'status' => Sponsorship::STATUS_ACTIVE,
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->deleteJson("/api/promotor/sponsors/{$sponsor->id}")
            ->assertJsonPath('success', false)
            ->assertStatus(422);
    }

    public function test_attach_sponsorship_to_event_and_update(): void
    {
        [$tenant, $promotor, $category] = $this->context('attach');
        $event = $this->event($tenant, $promotor, $category, 10, 'attach-event');
        $sponsor = Sponsor::create([
            'tenant_id' => $tenant->id,
            'name' => 'Bintang',
            'slug' => 'bintang',
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/sponsorships", [
                'sponsor_id' => $sponsor->id,
                'package_name' => 'Main Sponsor',
                'amount' => 50000000,
                'poa_threshold_pct' => 75,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.sponsor.name', 'Bintang');

        $sponsorship = Sponsorship::first();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->slug}/sponsorships", [
                'sponsor_id' => $sponsor->id,
                'amount' => 10000,
                'poa_threshold_pct' => 50,
            ])
            ->assertStatus(422);

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/sponsorships/{$sponsorship->id}", [
                'amount' => 55000000,
                'poa_threshold_pct' => 60,
            ])
            ->assertOk()
            ->assertJsonPath('data.amount', '55000000.00')
            ->assertJsonPath('data.poa_threshold_pct', 60);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/sponsorships")
            ->assertOk()
            ->assertJsonCount(1, 'data.sponsorships');
    }

    public function test_poa_report_counts_scans_and_segments_attendees(): void
    {
        [$tenant, $promotor, $category] = $this->context('poa');
        $event = $this->event($tenant, $promotor, $category, -1, 'poa-event');
        $ticket = $event->tickets()->first();

        $buyerA = User::factory()->create([
            'gender' => 'female',
            'birth_date' => '1998-05-10',
            'city' => 'Bandung',
        ]);
        $buyerB = User::factory()->create([
            'gender' => 'male',
            'birth_date' => '1985-01-01',
            'city' => 'Jakarta',
        ]);

        $itemA = $this->paidItem($event, $ticket, $buyerA);
        $itemB = $this->paidItem($event, $ticket, $buyerB);
        $this->paidItem($event, $ticket, $buyerB);

        $this->scan($itemA, $event, $promotor, 'valid');
        $this->scan($itemB, $event, $promotor, 'valid');

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/poa")
            ->assertOk()
            ->assertJsonPath('data.summary.tickets_sold', 3)
            ->assertJsonPath('data.summary.checked_in', 2)
            ->assertJsonPath('data.summary.unique_attendees', 2)
            ->assertJsonPath('data.summary.no_show', 1)
            ->assertJsonPath('data.summary.attendance_rate_pct', 67)
            ->assertJsonPath('data.segmentation.by_gender.female', 1)
            ->assertJsonPath('data.segmentation.by_gender.male', 1)
            ->assertJsonPath('data.segmentation.by_age_group.25-34', 1)
            ->assertJsonPath('data.segmentation.by_age_group.35-44', 1)
            ->assertJsonPath('data.segmentation.by_city.Bandung', 1)
            ->assertJsonPath('data.segmentation.by_city.Jakarta', 1)
            ->assertJsonPath('data.by_ticket.Regular', 2)
            ->assertJsonCount(1, 'data.series');
    }

    public function test_release_escrow_when_event_ended_and_threshold_met(): void
    {
        [$tenant, $promotor, $category] = $this->context('release');
        $event = $this->event($tenant, $promotor, $category, -1, 'release-event');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create(['city' => 'Surabaya']);

        $sponsor = Sponsor::create(['tenant_id' => $tenant->id, 'name' => 'Aqua', 'slug' => 'aqua']);
        $sponsorship = $event->sponsorships()->create([
            'tenant_id' => $tenant->id,
            'sponsor_id' => $sponsor->id,
            'amount' => 30000000,
            'poa_threshold_pct' => 50,
            'status' => Sponsorship::STATUS_ACTIVE,
        ]);

        $item = $this->paidItem($event, $ticket, $buyer);
        $this->scan($item, $event, $promotor, 'valid');

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/sponsorships/{$sponsorship->id}/release")
            ->assertOk()
            ->assertJsonPath('data.outcome', 'released')
            ->assertJsonPath('data.threshold_met', true)
            ->assertJsonPath('data.poa.summary.attendance_rate_pct', 100);

        $this->assertDatabaseHas('sponsorships', [
            'id' => $sponsorship->id,
            'status' => 'released',
        ]);
        $this->assertNotNull($sponsorship->fresh()->released_at);
    }

    public function test_release_refunds_when_threshold_not_met(): void
    {
        [$tenant, $promotor, $category] = $this->context('refund');
        $event = $this->event($tenant, $promotor, $category, -1, 'refund-event');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();

        $sponsor = Sponsor::create(['tenant_id' => $tenant->id, 'name' => 'Indomie', 'slug' => 'indomie']);
        $sponsorship = $event->sponsorships()->create([
            'tenant_id' => $tenant->id,
            'sponsor_id' => $sponsor->id,
            'amount' => 10000000,
            'poa_threshold_pct' => 90,
            'status' => Sponsorship::STATUS_ACTIVE,
        ]);

        $item = $this->paidItem($event, $ticket, $buyer);
        $itemB = $this->paidItem($event, $ticket, $buyer);
        $this->scan($item, $event, $promotor, 'valid');

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/sponsorships/{$sponsorship->id}/release")
            ->assertOk()
            ->assertJsonPath('data.outcome', 'refunded')
            ->assertJsonPath('data.threshold_met', false);

        $this->assertDatabaseHas('sponsorships', [
            'id' => $sponsorship->id,
            'status' => 'refunded',
        ]);
    }

    public function test_release_blocked_while_event_still_running(): void
    {
        [$tenant, $promotor, $category] = $this->context('running');
        $event = $this->event($tenant, $promotor, $category, 5, 'running-event');
        $sponsor = Sponsor::create(['tenant_id' => $tenant->id, 'name' => 'Telkom', 'slug' => 'telkom']);
        $sponsorship = $event->sponsorships()->create([
            'tenant_id' => $tenant->id,
            'sponsor_id' => $sponsor->id,
            'amount' => 10000000,
            'poa_threshold_pct' => 50,
            'status' => Sponsorship::STATUS_ACTIVE,
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/sponsorships/{$sponsorship->id}/release")
            ->assertStatus(422);
    }

    public function test_other_tenant_cannot_access_sponsorship(): void
    {
        [$tenant, $promotor, $category] = $this->context('owner');
        $event = $this->event($tenant, $promotor, $category, -1, 'owner-event');
        $sponsor = Sponsor::create(['tenant_id' => $tenant->id, 'name' => 'Owner', 'slug' => 'owner']);
        $sponsorship = $event->sponsorships()->create([
            'tenant_id' => $tenant->id,
            'sponsor_id' => $sponsor->id,
            'amount' => 5000000,
            'poa_threshold_pct' => 0,
            'status' => Sponsorship::STATUS_ACTIVE,
        ]);

        [$otherTenant] = $this->context('intruder');
        $other = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $other->assignRole('promotor');

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/poa")
            ->assertNotFound();

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/promotor/sponsorships/{$sponsorship->id}/release")
            ->assertNotFound();
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

    private function paidItem(Event $event, Ticket $ticket, User $buyer): OrderItem
    {
        $price = (int) $ticket->currentPrice();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $event->tenant_id,
            'subtotal' => $price,
            'admin_fee' => 0,
            'commission_fee' => 0,
            'total' => $price,
            'status' => 'paid',
            'paid_at' => now()->subDay(),
        ]);

        return OrderItem::create([
            'order_id' => $order->id,
            'ticket_id' => $ticket->id,
            'quantity' => 1,
            'price' => $price,
            'qr_code' => 'QR'.str()->upper(str()->random(12)),
        ]);
    }

    private function scan(OrderItem $item, Event $event, User $scanner, string $status): void
    {
        ScanLog::create([
            'order_item_id' => $item->id,
            'event_id' => $event->id,
            'scanned_by' => $scanner->id,
            'scan_status' => $status,
            'scanned_at' => now()->subHour(),
        ]);
    }
}

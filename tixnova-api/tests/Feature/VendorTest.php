<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Rfq;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBooking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VendorTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_crud_and_summary(): void
    {
        [$tenant, $promotor, $category] = $this->context('vendor');
        $event = $this->event($tenant, $promotor, $category, 10, 'vendor-event');

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/vendors', [
                'name' => 'Cahaya Lighting',
                'category' => 'lighting',
                'contact_phone' => '08123456789',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Cahaya Lighting');

        $vendor = Vendor::first();
        $this->assertNotNull($vendor->slug);

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/vendors/{$vendor->id}", ['category' => 'sound'])
            ->assertOk()
            ->assertJsonPath('data.category', 'sound');

        $event->vendorBookings()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->id,
            'amount' => 5000000,
            'deposit_pct' => 20,
            'deposit' => 1000000,
            'status' => VendorBooking::STATUS_CONFIRMED,
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/vendors')
            ->assertOk()
            ->assertJsonPath('data.summary.total_vendors', 1)
            ->assertJsonPath('data.summary.active_bookings', 1);

        $this->actingAs($promotor, 'sanctum')
            ->deleteJson("/api/promotor/vendors/{$vendor->id}")
            ->assertStatus(422);
    }

    public function test_booking_escrow_release_after_event_ends(): void
    {
        [$tenant, $promotor, $category] = $this->context('release');
        $event = $this->event($tenant, $promotor, $category, -1, 'release-vendor-event');
        $vendor = Vendor::create([
            'tenant_id' => $tenant->id,
            'name' => 'Gema Sound',
            'slug' => 'gema-sound',
            'category' => 'sound',
        ]);

        $booking = $event->vendorBookings()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->id,
            'service' => 'Sound system utama',
            'amount' => 15000000,
            'deposit_pct' => 20,
            'deposit' => 3000000,
            'status' => VendorBooking::STATUS_CONFIRMED,
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$event->slug}/vendor-bookings")
            ->assertOk()
            ->assertJsonCount(1, 'data.bookings')
            ->assertJsonPath('data.bookings.0.vendor.name', 'Gema Sound');

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/vendor-bookings/{$booking->id}/release")
            ->assertOk()
            ->assertJsonPath('data.outcome', 'released');

        $this->assertDatabaseHas('vendor_bookings', [
            'id' => $booking->id,
            'status' => 'released',
        ]);
        $this->assertNotNull($booking->fresh()->released_at);
    }

    public function test_booking_release_blocked_while_event_running(): void
    {
        [$tenant, $promotor, $category] = $this->context('running');
        $event = $this->event($tenant, $promotor, $category, 5, 'running-vendor-event');
        $vendor = Vendor::create([
            'tenant_id' => $tenant->id,
            'name' => 'Sinar Stage',
            'slug' => 'sinar-stage',
            'category' => 'stage',
        ]);
        $booking = $event->vendorBookings()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->id,
            'amount' => 8000000,
            'deposit_pct' => 20,
            'deposit' => 1600000,
            'status' => VendorBooking::STATUS_CONFIRMED,
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/vendor-bookings/{$booking->id}/release")
            ->assertStatus(422);
    }

    public function test_rfq_offer_and_award_creates_booking(): void
    {
        [$tenant, $promotor, $category] = $this->context('rfq');
        $event = $this->event($tenant, $promotor, $category, 7, 'rfq-event');
        $vendorA = Vendor::create(['tenant_id' => $tenant->id, 'name' => 'Catering A', 'slug' => 'catering-a', 'category' => 'catering']);
        $vendorB = Vendor::create(['tenant_id' => $tenant->id, 'name' => 'Catering B', 'slug' => 'catering-b', 'category' => 'catering']);

        $rfq = $event->rfqs()->create([
            'tenant_id' => $tenant->id,
            'service' => 'Katering 500 pax',
            'budget' => 25000000,
            'status' => Rfq::STATUS_OPEN,
        ]);

        $offerA = $rfq->offers()->create(['tenant_id' => $tenant->id, 'vendor_id' => $vendorA->id, 'quote' => 24000000]);
        $rfq->offers()->create(['tenant_id' => $tenant->id, 'vendor_id' => $vendorB->id, 'quote' => 22000000, 'is_winner' => true]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/rfqs/{$rfq->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data.offers')
            ->assertJsonPath('data.offers.0.quote', '22000000.00');

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/rfqs/{$rfq->id}/award", ['offer_id' => $offerA->id])
            ->assertOk()
            ->assertJsonPath('data.amount', '24000000.00')
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('rfqs', ['id' => $rfq->id, 'status' => 'awarded']);
        $this->assertDatabaseHas('rfq_offers', ['id' => $offerA->id, 'is_winner' => 1]);
        $this->assertDatabaseHas('rfq_offers', ['id' => $offerA->id + 1, 'is_winner' => 0]);

        $booking = VendorBooking::first();
        $this->assertEquals('24000000.00', $booking->amount);
        $this->assertEquals('4800000.00', $booking->deposit);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/rfqs/{$rfq->id}/offers", ['vendor_id' => $vendorB->id, 'quote' => 21000000])
            ->assertStatus(422);
    }

    public function test_other_tenant_cannot_access_booking_and_rfq(): void
    {
        [$tenant, $promotor, $category] = $this->context('owner');
        $event = $this->event($tenant, $promotor, $category, -1, 'owner-vendor-event');
        $vendor = Vendor::create(['tenant_id' => $tenant->id, 'name' => 'Owner Vendor', 'slug' => 'owner-vendor', 'category' => 'other']);
        $booking = $event->vendorBookings()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->id,
            'amount' => 1000000,
            'deposit_pct' => 10,
            'deposit' => 100000,
            'status' => VendorBooking::STATUS_CONFIRMED,
        ]);
        $rfq = $event->rfqs()->create([
            'tenant_id' => $tenant->id,
            'service' => 'Keamanan',
            'status' => Rfq::STATUS_OPEN,
        ]);

        [$otherTenant] = $this->context('intruder');
        $other = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $other->assignRole('promotor');

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/promotor/vendor-bookings/{$booking->id}/release")
            ->assertNotFound();

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/promotor/rfqs/{$rfq->id}")
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
}

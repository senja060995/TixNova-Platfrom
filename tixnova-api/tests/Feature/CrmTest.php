<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Services\CrmService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CrmTest extends TestCase
{
    use RefreshDatabase;

    public function test_rfm_segmentation_rules(): void
    {
        $service = app(CrmService::class);

        $this->assertEquals('new', $service->segmentFor(User::factory()->create()));

        [$tenant, $event] = $this->eventContext();
        $this->assertEquals('first_timer', $service->segmentFor($this->buyerWithOrder($tenant, $event, 1, now()->subDays(10))));
        $this->assertEquals('repeat', $service->segmentFor($this->buyerWithOrder($tenant, $event, 2, now()->subDays(5))));
        $this->assertEquals('vip', $service->segmentFor($this->buyerWithOrder($tenant, $event, 5, now()->subDays(2))));
        $this->assertEquals('churned', $service->segmentFor($this->buyerWithOrder($tenant, $event, 1, now()->subDays(100))));
    }

    public function test_user_crm_summary_and_recommendations(): void
    {
        [$tenant, $event, $promotor] = $this->eventContext();
        $buyer = $this->buyerWithOrder($tenant, $event, 1, now()->subDays(3));

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/user/crm/summary')
            ->assertOk()
            ->assertJsonPath('data.segment', 'first_timer')
            ->assertJsonPath('data.total_orders', 1);

        $this->similarEvent($event, $promotor, 'Event Serupa');

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/user/crm/recommendations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.city', $event->city);
    }

    public function test_promotor_segment_counts_and_members(): void
    {
        [$tenant, $event, $promotor] = $this->eventContext();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $this->buyerWithOrder($tenant, $event, 1, now()->subDays(3));
        $this->buyerWithOrder($tenant, $event, 2, now()->subDays(4));

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/crm/segments')
            ->assertOk()
            ->assertJsonPath('data.segments.first_timer', 1)
            ->assertJsonPath('data.segments.repeat', 1);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/crm/segments/repeat')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.orders', 2);
    }

    public function test_promotor_similar_events(): void
    {
        [$tenant, $event, $promotor] = $this->eventContext();
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');

        $this->similarEvent($event, $promotor, 'Event Serupa');

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/crm/similar/{$event->slug}")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $this->similarSlug);
    }

    private string $similarSlug = '';

    private function similarEvent(Event $source, User $promotor, string $title): Event
    {
        $slug = str($title)->slug().'-'.str()->lower(str()->random(6));
        $this->similarSlug = $slug;

        $similar = Event::withoutGlobalScopes()->create([
            'tenant_id' => $source->tenant_id,
            'user_id' => $promotor->id,
            'category_id' => $source->category_id,
            'title' => $title,
            'slug' => $slug,
            'venue' => 'Venue',
            'city' => $source->city,
            'start_date' => now()->addMonth(),
            'end_date' => now()->addMonth()->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $similar->id, 'name' => 'Regular', 'price' => 50000, 'quota' => 10]);

        return $similar;
    }

    private function eventContext(): array
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

    private function buyerWithOrder(Tenant $tenant, Event $event, int $count, $paidAt): User
    {
        $buyer = User::factory()->create();

        for ($i = 0; $i < $count; $i++) {
            $order = Order::withoutGlobalScopes()->create([
                'user_id' => $buyer->id,
                'event_id' => $event->id,
                'tenant_id' => $tenant->id,
                'subtotal' => 100000,
                'admin_fee' => 5000,
                'commission_fee' => 5000,
                'discount' => 0,
                'total' => 105000,
                'status' => 'paid',
                'buyer_name' => 'Buyer',
                'buyer_email' => 'buyer@example.test',
                'buyer_phone' => '081234567890',
                'paid_at' => $paidAt,
            ]);
            $order->items()->create(['ticket_id' => $event->tickets()->first()->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
            Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);
        }

        return $buyer;
    }
}

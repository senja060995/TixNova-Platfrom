<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PricingTest extends TestCase
{
    use RefreshDatabase;

    public function test_pricing_index_returns_insights_for_upcoming_events(): void
    {
        [$tenant, $event, $promotor] = $this->context(40, 50, 100, 'approved');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/pricing')
            ->assertOk()
            ->assertJsonPath('data.0.id', $event->id)
            ->assertJsonPath('data.0.sell_through_pct', 50)
            ->assertJsonCount(1, 'data');
    }

    public function test_high_sell_through_suggests_raise(): void
    {
        [$tenant, $event, $promotor] = $this->context(40, 85, 100, 'approved');
        $this->similarEvent($tenant, $promotor, 'Konser', 'Jakarta', 100000);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/pricing/{$event->slug}")
            ->assertOk()
            ->assertJsonPath('data.recommendation.action', 'raise')
            ->assertJsonPath('data.tickets.0.suggested_action', 'raise')
            ->assertJsonPath('data.recommendation.urgency', 'low');
    }

    public function test_low_sell_through_near_event_suggests_promo(): void
    {
        [$tenant, $event, $promotor] = $this->context(7, 20, 100, 'approved');

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/pricing/{$event->slug}")
            ->assertOk()
            ->assertJsonPath('data.recommendation.action', 'promo')
            ->assertJsonPath('data.recommendation.promo.suggested', true)
            ->assertJsonPath('data.recommendation.promo.discount_pct', 20)
            ->assertJsonPath('data.recommendation.urgency', 'high');
    }

    public function test_forecast_returns_projection(): void
    {
        [$tenant, $event, $promotor] = $this->context(10, 30, 100, 'approved');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();

        $series = [6 => 6, 5 => 6, 4 => 6, 3 => 6, 2 => 6];
        foreach ($series as $daysAgo => $qty) {
            $this->paidOrder($event, $ticket, $qty, now()->subDays($daysAgo), $buyer);
        }

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/pricing/{$event->slug}/forecast?days=10")
            ->assertOk()
            ->assertJsonPath('data.tickets.0.method', 'moving_average')
            ->assertJsonPath('data.tickets.0.sold', 30)
            ->assertJsonPath('data.tickets.0.projected_sales', 60)
            ->assertJsonPath('data.tickets.0.projected_remaining', 10)
            ->assertJsonPath('data.tickets.0.projected_sell_through_pct', 90)
            ->assertJsonPath('data.event_total.projected_remaining', 10);
    }

    public function test_anomalies_detects_spike(): void
    {
        [$tenant, $event, $promotor] = $this->context(30, 5, 100, 'approved');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();

        foreach ([6, 5, 4, 3, 2] as $daysAgo) {
            $this->paidOrder($event, $ticket, 1, now()->subDays($daysAgo), $buyer);
        }
        $this->paidOrder($event, $ticket, 10, now(), $buyer);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/pricing/anomalies')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'spike')
            ->assertJsonPath('data.0.metric', 10);
    }

    public function test_other_tenant_cannot_access_pricing_detail(): void
    {
        [$tenant, $event, $promotor] = $this->context(40, 5, 100, 'approved');

        Role::findOrCreate('promotor');
        $otherTenant = Tenant::create([
            'name' => 'Other',
            'slug' => 'other-'.str()->lower(str()->random(6)),
            'email' => str()->random(6).'@example.test',
            'status' => 'active',
        ]);
        $other = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $other->assignRole('promotor');

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/promotor/pricing/{$event->slug}")
            ->assertNotFound();
    }

    private function context(int $daysToEvent, int $sold, int $quota, string $status): array
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

        $category = Category::create([
            'name' => 'Konser',
            'slug' => 'konser-'.$suffix,
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
            'start_date' => now()->addDays($daysToEvent),
            'end_date' => now()->addDays($daysToEvent)->addHours(2),
            'status' => $status,
        ]);
        Ticket::create([
            'event_id' => $event->id,
            'name' => 'Regular',
            'price' => 100000,
            'quota' => $quota,
            'sold' => $sold,
        ]);

        return [$tenant, $event, $promotor];
    }

    private function similarEvent(Tenant $tenant, User $promotor, string $categoryName, string $city, int $price): Event
    {
        $category = Category::create(['name' => $categoryName, 'slug' => str()->slug($categoryName).'-'.str()->lower(str()->random(5)), 'type' => 'event', 'is_active' => true]);
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'category_id' => $category->id,
            'title' => 'Similar '.$categoryName,
            'slug' => 'similar-'.str()->lower(str()->random(6)),
            'venue' => 'Venue',
            'city' => $city,
            'start_date' => now()->addWeeks(3),
            'end_date' => now()->addWeeks(3)->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => $price, 'quota' => 50]);

        return $event;
    }

    private function paidOrder(Event $event, Ticket $ticket, int $qty, $paidAt, User $buyer): Order
    {
        $price = (int) $ticket->currentPrice();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $event->tenant_id,
            'subtotal' => $qty * $price,
            'admin_fee' => 0,
            'commission_fee' => 0,
            'total' => $qty * $price,
            'status' => 'paid',
            'paid_at' => $paidAt,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'ticket_id' => $ticket->id,
            'quantity' => $qty,
            'price' => $price,
            'qr_code' => 'QR'.str()->upper(str()->random(12)),
        ]);

        return $order;
    }
}

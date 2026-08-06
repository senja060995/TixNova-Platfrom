<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\FactEventDaily;
use App\Models\FactOrderDaily;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InsightTest extends TestCase
{
    use RefreshDatabase;

    public function test_analytics_build_populates_warehouse(): void
    {
        [$tenant, $promotor, $category] = $this->context('build');
        $event = $this->event($tenant, $promotor, $category, 10, 'build-event');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();

        $this->paidOrder($event, $ticket, 2, now()->subDays(2), $buyer);
        $this->paidOrder($event, $ticket, 3, now()->subDays(1), $buyer);

        $this->artisan('analytics:build')->assertExitCode(0);

        $this->assertDatabaseCount('fact_order_daily', 2);
        $this->assertDatabaseCount('fact_event_daily', 3);

        $secondDay = FactOrderDaily::where('event_id', $event->id)
            ->whereDate('sale_date', now()->subDays(1)->toDateString())
            ->first();
        $this->assertEquals(3, $secondDay->tickets_sold);
        $this->assertEquals(300000.0, (float) $secondDay->net_amount);

        $today = FactEventDaily::where('event_id', $event->id)
            ->whereDate('snapshot_date', now()->toDateString())
            ->first();
        $this->assertEquals(5, $today->sold_total);
        $this->assertEquals(5, $today->sell_through_pct);
        $this->assertEquals(500000.0, (float) $today->revenue_total);
    }

    public function test_insights_overview_returns_kpis(): void
    {
        [$tenant, $promotor, $category] = $this->context('overview');
        $event = $this->event($tenant, $promotor, $category, 10, 'overview-event');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();

        $this->paidOrder($event, $ticket, 2, now()->subDays(3), $buyer);
        $this->paidOrder($event, $ticket, 3, now()->subDays(2), $buyer);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/insights/overview')
            ->assertOk()
            ->assertJsonPath('data.tickets_sold', 5)
            ->assertJsonPath('data.orders', 2)
            ->assertJsonCount(2, 'data.series')
            ->assertJsonPath('data.series.0.tickets_sold', 2)
            ->assertJsonPath('data.series.1.tickets_sold', 3)
            ->assertJsonPath('data.gmv', 500000);
    }

    public function test_insights_benchmark_returns_anonymized_stats(): void
    {
        [$tenant, $promotor, $category] = $this->context('bench-a');
        $this->event($tenant, $promotor, $category, 10, 'bench-a-event', 40, 100, 100000);

        [$otherTenant, $otherPromotor, $otherCategory] = $this->context('bench-b');
        $this->event($otherTenant, $otherPromotor, $otherCategory, 15, 'bench-b-event', 80, 100, 150000);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/insights/benchmark?city=Jakarta')
            ->assertOk()
            ->assertJsonPath('data.event_count', 2)
            ->assertJsonPath('data.avg_ticket_price', 125000)
            ->assertJsonPath('data.median_ticket_price', 125000)
            ->assertJsonPath('data.avg_sell_through_pct', 60)
            ->assertJsonPath('data.avg_tickets_sold', 60);
    }

    public function test_insights_event_insight_compares_with_benchmark(): void
    {
        [$tenant, $promotor, $category] = $this->context('event-a');
        $event = $this->event($tenant, $promotor, $category, 10, 'event-a-slug', 30, 100, 100000);
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();
        $this->paidOrder($event, $ticket, 3, now()->subDays(1), $buyer);

        $this->event($tenant, $promotor, $category, 20, 'event-b-slug', 90, 100, 150000);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/insights/events/{$event->slug}")
            ->assertOk()
            ->assertJsonPath('data.performance.tickets_sold', 30)
            ->assertJsonPath('data.performance.sell_through_pct', 30)
            ->assertJsonPath('data.vs_benchmark.status', 'below')
            ->assertJsonPath('data.vs_benchmark.tickets_sold_ratio', 0.33)
            ->assertJsonPath('data.vs_benchmark.expected_sell_through_pct', 35);
    }

    public function test_insights_event_daily_returns_cumulative_series(): void
    {
        [$tenant, $promotor, $category] = $this->context('daily');
        $event = $this->event($tenant, $promotor, $category, 10, 'daily-event');
        $ticket = $event->tickets()->first();
        $buyer = User::factory()->create();

        $this->paidOrder($event, $ticket, 2, now()->subDays(2), $buyer);
        $this->paidOrder($event, $ticket, 3, now()->subDays(1), $buyer);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/insights/events/{$event->slug}/daily")
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.sold_total', 2)
            ->assertJsonPath('data.1.sold_total', 5)
            ->assertJsonPath('data.2.sell_through_pct', 5);
    }

    public function test_other_tenant_cannot_access_insight_detail(): void
    {
        [$tenant, $promotor, $category] = $this->context('owner');
        $event = $this->event($tenant, $promotor, $category, 10, 'owner-event');

        [$otherTenant] = $this->context('intruder');
        $other = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $other->assignRole('promotor');

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/promotor/insights/events/{$event->slug}")
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

    private function event(Tenant $tenant, User $promotor, Category $category, int $daysToEvent, string $slug, int $sold = 0, int $quota = 100, int $price = 100000): Event
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
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => $price, 'quota' => $quota, 'sold' => $sold]);

        return $event;
    }

    private function paidOrder(Event $event, Ticket $ticket, int $qty, $paidAt, User $buyer): void
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
    }
}

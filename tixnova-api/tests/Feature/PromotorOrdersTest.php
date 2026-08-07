<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PromotorOrdersTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_list_orders(): void
    {
        [$promotor, $event, $order] = $this->context();

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/orders')
            ->assertOk()
            ->assertJsonPath('data.data.0.order_code', $order->order_code)
            ->assertJsonPath('data.data.0.buyer_name', 'Buyer Test')
            ->assertJsonPath('data.data.0.event.id', $event->id);
    }

    public function test_promotor_can_filter_orders_by_event(): void
    {
        [$promotor, $event, $order] = $this->context();
        $suffix = str()->lower(str()->random(10));
        $secondEvent = Event::withoutGlobalScopes()->create([
            'tenant_id' => $promotor->tenant_id,
            'user_id' => $promotor->id,
            'title' => 'Event 2 '.$suffix,
            'slug' => 'event-2-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        $ticket = Ticket::create(['event_id' => $secondEvent->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);
        $secondOrder = Order::withoutGlobalScopes()->create($this->orderData($promotor, $secondEvent, $ticket));

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/orders?event_id={$event->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.order_code', $order->order_code);

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$event->id}/orders")
            ->assertOk()
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.order_code', $order->order_code);

        $this->assertDatabaseHas('orders', ['id' => $secondOrder->id]);
    }

    public function test_promotor_can_search_orders(): void
    {
        [$promotor, $event, $order] = $this->context();

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/orders?search='.$order->order_code)
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/orders?search=TIDAK-ADA')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
    }

    public function test_promotor_can_filter_orders_by_status(): void
    {
        [$promotor, $event, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/orders?status=paid')
            ->assertOk()
            ->assertJsonCount(1, 'data.data');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/orders?status=cancelled')
            ->assertOk()
            ->assertJsonCount(0, 'data.data');
    }

    public function test_promotor_cannot_access_other_tenant_orders(): void
    {
        [$promotor] = $this->context();
        $suffix = str()->lower(str()->random(10));
        $otherTenant = Tenant::create(['name' => 'Other '.$suffix, 'slug' => 'other-'.$suffix, 'email' => "other{$suffix}@example.test", 'status' => 'active']);
        $otherPromotor = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherPromotor->assignRole('promotor');
        $otherEvent = Event::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id,
            'user_id' => $otherPromotor->id,
            'title' => 'Other Event '.$suffix,
            'slug' => 'other-event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        $ticket = Ticket::create(['event_id' => $otherEvent->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);
        Order::withoutGlobalScopes()->create($this->orderData($otherPromotor, $otherEvent, $ticket));

        $this->actingAs($promotor, 'sanctum')
            ->getJson("/api/promotor/events/{$otherEvent->id}/orders")
            ->assertNotFound();
    }

    private function orderData(User $promotor, Event $event, Ticket $ticket): array
    {
        $buyer = User::factory()->create();

        return [
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $promotor->tenant_id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'commission_fee' => 5000,
            'discount' => 0,
            'total' => 105000,
            'status' => 'pending',
            'buyer_name' => 'Buyer Test',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
        ];
    }

    private function context(): array
    {
        Role::findOrCreate('promotor');
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        $promotor->assignRole('promotor');
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
        $orderData = $this->orderData($promotor, $event, $ticket);
        $order = Order::withoutGlobalScopes()->create($orderData);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'pending']);

        return [$promotor, $event, $order];
    }
}

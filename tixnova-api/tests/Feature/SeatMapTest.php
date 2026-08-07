<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Seat;
use App\Models\SeatMap;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Services\CheckoutService;
use App\Services\SeatReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SeatMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_create_seat_map(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $response = $this->actingAs($promotor, 'sanctum')->putJson(
            "/api/promotor/events/{$event->slug}/seat-map",
            [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [
                            ['label' => 'A', 'seats' => 3],
                        ],
                    ],
                ],
            ]
        );

        $response->assertOk()->assertJsonPath('data.name', 'Main Hall');
        $this->assertDatabaseHas('seat_maps', ['event_id' => $event->id, 'name' => 'Main Hall']);
        $this->assertDatabaseCount('seats', 3);
    }

    public function test_checkout_persists_allocated_seat_label_on_order_item(): void
    {
        [$buyer, $event, $ticket, $seat] = $this->checkoutContext();

        $order = $this->app->make(CheckoutService::class)->create($buyer, [
            'event_id' => $event->id,
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'payment_method' => 'qris',
            'items' => [[
                'ticket_id' => $ticket->id,
                'quantity' => 1,
                'seat_ids' => [$seat->id],
                'attendees' => [],
            ]],
        ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'seat_id' => $seat->id,
            'seat_number' => $seat->label,
        ]);
    }

    public function test_promotor_cannot_modify_seat_map_after_seat_is_held(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $seatMap = SeatMap::first();
        $seatMap->update(['locked_at' => now()]);

        $response = $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Updated',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'B',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'B', 'seats' => 5]],
                    ],
                ],
            ]);

        $response->assertUnprocessable();
    }

    public function test_promotor_cannot_create_seat_map_with_foreign_ticket(): void
    {
        [$promotor, $event] = $this->promoterContext();
        $otherEvent = Event::withoutGlobalScopes()->create([
            'tenant_id' => $event->tenant_id, 'user_id' => $promotor->id,
            'title' => 'Other Event', 'slug' => 'other-event', 'venue' => 'Venue',
            'city' => 'Jakarta', 'start_date' => now()->addDays(30), 'end_date' => now()->addDays(30)->addHours(2),
        ]);
        Ticket::create(['event_id' => $otherEvent->id, 'name' => 'Other', 'price' => 50000, 'quota' => 10]);

        $response = $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $otherEvent->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $response->assertUnprocessable();
    }

    public function test_public_can_view_published_seat_map(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 2]],
                    ],
                ],
            ]);

        $response = $this->getJson("/api/events/{$event->slug}/seat-map");
        $response->assertOk()->assertJsonPath('data.name', 'Main Hall');
        $this->assertCount(2, $response->json('data.seats'));
    }

    public function test_public_cannot_view_unpublished_seat_map(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => false,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 2]],
                    ],
                ],
            ]);

        $response = $this->getJson("/api/events/{$event->slug}/seat-map");
        $response->assertNotFound();
    }

    public function test_seat_hold_prevents_double_booking(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $seatMap = SeatMap::first();
        $seat = Seat::where('seat_map_id', $seatMap->id)->first();

        $buyer = User::factory()->create();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'pending', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'expired_at' => now()->addMinutes(15),
        ]);

        $this->app->make(SeatReservationService::class)->hold($seatMap, $order, [$event->tickets->first()->id => [$seat->id]]);

        $secondOrder = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'pending', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'expired_at' => now()->addMinutes(15),
        ]);

        $this->expectException(ValidationException::class);
        $this->app->make(SeatReservationService::class)->hold($seatMap, $secondOrder, [$event->tickets->first()->id => [$seat->id]]);
    }

    public function test_seat_hold_requires_seated_ticket(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $seatMap = SeatMap::first();
        $seat = Seat::where('seat_map_id', $seatMap->id)->first();

        $buyer = User::factory()->create();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'pending', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'expired_at' => now()->addMinutes(15),
        ]);

        $this->app->make(SeatReservationService::class)->hold($seatMap, $order, [$event->tickets->first()->id => [$seat->id]]);

        $seat->update(['status' => 'sold', 'hold_order_id' => null, 'held_at' => null]);

        $thirdOrder = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'pending', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'expired_at' => now()->addMinutes(15),
        ]);

        $this->expectException(ValidationException::class);
        $this->app->make(SeatReservationService::class)->hold($seatMap, $thirdOrder, [$event->tickets->first()->id => [$seat->id]]);
    }

    public function test_seat_release_returns_held_seats_to_available(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $seatMap = SeatMap::first();
        $seat = Seat::where('seat_map_id', $seatMap->id)->first();

        $buyer = User::factory()->create();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'pending', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'expired_at' => now()->addMinutes(15),
        ]);

        $this->app->make(SeatReservationService::class)->hold($seatMap, $order, [$event->tickets->first()->id => [$seat->id]]);
        $this->assertEquals('held', $seat->fresh()->status);

        $this->app->make(SeatReservationService::class)->release($order);
        $this->assertEquals('available', $seat->fresh()->status);
        $this->assertNull($seat->fresh()->hold_order_id);
    }

    public function test_seat_sell_marks_seat_as_sold(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $seatMap = SeatMap::first();
        $seat = Seat::where('seat_map_id', $seatMap->id)->first();

        $buyer = User::factory()->create();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'paid', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);

        $this->app->make(SeatReservationService::class)->hold($seatMap, $order, [$event->tickets->first()->id => [$seat->id]]);
        $this->app->make(SeatReservationService::class)->sell($order);

        $this->assertEquals('sold', $seat->fresh()->status);
        $this->assertNotNull($seat->fresh()->sold_at);
    }

    public function test_return_to_inventory_marks_sold_seats_as_available(): void
    {
        [$promotor, $event] = $this->promoterContext();

        $this->actingAs($promotor, 'sanctum')
            ->putJson("/api/promotor/events/{$event->slug}/seat-map", [
                'name' => 'Main Hall',
                'is_published' => true,
                'sections' => [
                    [
                        'name' => 'A',
                        'ticket_id' => $event->tickets->first()->id,
                        'rows' => [['label' => 'A', 'seats' => 3]],
                    ],
                ],
            ]);

        $seatMap = SeatMap::first();
        $seat = Seat::where('seat_map_id', $seatMap->id)->first();

        $buyer = User::factory()->create();
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $event->tenant_id,
            'subtotal' => 100000, 'admin_fee' => 5000, 'total' => 105000,
            'status' => 'paid', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@test.com', 'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);
        $order->items()->create(['ticket_id' => $event->tickets->first()->id, 'seat_id' => $seat->id, 'quantity' => 1, 'price' => 100000, 'attendee_name' => 'Buyer', 'attendee_email' => 'buyer@test.com', 'attendee_phone' => '081234567890', 'qr_code' => 'QR-'.str()->random(24)]);

        $this->app->make(SeatReservationService::class)->hold($seatMap, $order, [$event->tickets->first()->id => [$seat->id]]);
        $this->app->make(SeatReservationService::class)->sell($order);
        $this->assertEquals('sold', $seat->fresh()->status);

        $this->app->make(SeatReservationService::class)->returnToInventory($order);
        $this->assertEquals('available', $seat->fresh()->status);
        $this->assertNull($seat->fresh()->sold_at);
    }

    public function test_tenant_isolation_for_seat_map(): void
    {
        Role::findOrCreate('promotor');
        $suffix = str()->lower(str()->random(10));
        $tenant1 = Tenant::create(['name' => 'Tenant1 '.$suffix, 'slug' => 'tenant1-'.$suffix, 'email' => "{$suffix}1@test.test", 'status' => 'active']);
        $tenant2 = Tenant::create(['name' => 'Tenant2 '.$suffix, 'slug' => 'tenant2-'.$suffix, 'email' => "{$suffix}2@test.test", 'status' => 'active']);
        $promotor1 = User::factory()->create(['tenant_id' => $tenant1->id]);
        $promotor1->assignRole('promotor');
        $promotor2 = User::factory()->create(['tenant_id' => $tenant2->id]);
        $promotor2->assignRole('promotor');

        $event1 = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant1->id, 'user_id' => $promotor1->id, 'title' => 'Event 1', 'slug' => 'event-1-'.$suffix,
            'venue' => 'Venue', 'city' => 'Jakarta', 'start_date' => now()->addDays(30), 'end_date' => now()->addDays(30)->addHours(2),
        ]);
        Ticket::create(['event_id' => $event1->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        $event2 = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant2->id, 'user_id' => $promotor2->id, 'title' => 'Event 2', 'slug' => 'event-2-'.$suffix,
            'venue' => 'Venue', 'city' => 'Bandung', 'start_date' => now()->addDays(30), 'end_date' => now()->addDays(30)->addHours(2),
        ]);
        Ticket::create(['event_id' => $event2->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        $response = $this->actingAs($promotor1, 'sanctum')
            ->getJson("/api/promotor/events/{$event2->slug}/seat-map");
        $response->assertNotFound();
    }

    private function checkoutContext(): array
    {
        [$promotor, $event] = $this->promoterContext();
        $ticket = $event->tickets()->firstOrFail();
        $seatMap = SeatMap::create(['event_id' => $event->id, 'name' => 'Main Hall', 'is_published' => true]);
        $seat = Seat::create([
            'seat_map_id' => $seatMap->id,
            'ticket_id' => $ticket->id,
            'section' => 'VIP',
            'row_label' => 'A',
            'number' => 1,
            'label' => 'VIP-A1',
        ]);

        return [User::factory()->create(), $event, $ticket, $seat];
    }

    private function promoterContext(): array
    {
        Role::findOrCreate('promotor');
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create(['name' => 'Tenant '.$suffix, 'slug' => 'tenant-'.$suffix, 'email' => "{$suffix}@example.test", 'status' => 'active']);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        $promotor->assignRole('promotor');
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id, 'user_id' => $promotor->id, 'title' => 'Event '.$suffix, 'slug' => 'event-'.$suffix,
            'venue' => 'Venue', 'city' => 'Jakarta', 'start_date' => now()->addDays(30), 'end_date' => now()->addDays(30)->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        return [$promotor, $event];
    }
}

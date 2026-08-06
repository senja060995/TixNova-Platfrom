<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PromotorScanTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_check_in_a_paid_ticket_for_own_event_once(): void
    {
        [$promotor, $event, $item] = $this->ticketContext();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->id}/scan", ['qr_code' => $item->qr_code])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('order_items', ['id' => $item->id, 'qr_used' => true]);
        $this->assertDatabaseHas('scan_logs', ['order_item_id' => $item->id, 'scan_status' => 'valid']);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$event->id}/scan", ['qr_code' => $item->qr_code])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Tiket sudah digunakan.');

        $this->assertDatabaseHas('scan_logs', ['order_item_id' => $item->id, 'scan_status' => 'already_used']);
    }

    public function test_promotor_cannot_scan_a_ticket_for_another_tenant_event(): void
    {
        [$promotor, , $item] = $this->ticketContext();
        [, $otherEvent] = $this->ticketContext();

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/events/{$otherEvent->id}/scan", ['qr_code' => $item->qr_code])
            ->assertNotFound();

        $this->assertDatabaseHas('order_items', ['id' => $item->id, 'qr_used' => false]);
    }

    private function ticketContext(): array
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
        $buyer = User::factory()->create();
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
        $ticket = Ticket::create([
            'event_id' => $event->id,
            'name' => 'Regular',
            'price' => 50000,
            'quota' => 100,
        ]);
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 50000,
            'admin_fee' => 5000,
            'discount' => 0,
            'total' => 55000,
            'status' => 'paid',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);
        $item = $order->items()->create([
            'ticket_id' => $ticket->id,
            'quantity' => 1,
            'price' => 50000,
            'attendee_name' => 'Attendee',
            'qr_code' => 'QR-'.str()->upper(str()->random(24)),
        ]);

        return [$promotor, $event, $item];
    }
}

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

class TrustLedgerTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_paid_records_ledger_sale_and_fee(): void
    {
        [$tenant, $order] = $this->context();

        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertDatabaseHas('ledger_entries', [
            'order_id' => $order->id,
            'type' => 'sale',
            'amount' => 105000,
        ]);
        $this->assertDatabaseHas('ledger_entries', [
            'order_id' => $order->id,
            'type' => 'fee',
            'amount' => -5000,
        ]);
    }

    public function test_order_refunded_records_ledger_refund(): void
    {
        [$tenant, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $order->update(['status' => 'refunded']);

        $this->assertDatabaseHas('ledger_entries', [
            'order_id' => $order->id,
            'type' => 'refund',
            'amount' => -100000,
        ]);
    }

    public function test_ledger_recording_is_idempotent(): void
    {
        [$tenant, $order] = $this->context();

        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $order->update(['status' => 'paid']);

        $this->assertDatabaseCount('ledger_entries', 2);
    }

    public function test_trust_score_refreshes_on_paid_then_drops_on_refund(): void
    {
        [$tenant, $order] = $this->context();

        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $this->assertEquals(100, (float) $tenant->fresh()->trust_score);
        $this->assertEquals('verified', $tenant->fresh()->badge);

        $order->update(['status' => 'refunded']);
        $this->assertLessThan(100, (float) $tenant->fresh()->trust_score);
    }

    public function test_public_event_exposes_tenant_trust_badge(): void
    {
        [$tenant, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $event = Event::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();

        $this->getJson("/api/events/{$event->slug}")
            ->assertOk()
            ->assertJsonPath('data.tenant.trust_score', '100.00')
            ->assertJsonPath('data.tenant.badge', 'verified');
    }

    public function test_super_admin_can_view_trust_overview(): void
    {
        [$tenant, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        Role::findOrCreate('super_admin');
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/super-admin/trust')
            ->assertOk()
            ->assertJsonPath('data.0.name', $tenant->name)
            ->assertJsonPath('data.0.balance.gross', 105000);
    }

    private function context(): array
    {
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $organizer = User::factory()->create(['tenant_id' => $tenant->id]);
        $buyer = User::factory()->create();
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $organizer->id,
            'title' => 'Event '.$suffix,
            'slug' => 'event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        $ticket = Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);
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
        ]);
        $order->items()->create(['ticket_id' => $ticket->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'pending']);

        return [$tenant, $order];
    }
}

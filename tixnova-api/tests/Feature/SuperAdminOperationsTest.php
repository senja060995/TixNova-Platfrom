<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SuperAdminOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_filter_global_events_and_non_admin_is_forbidden(): void
    {
        [$admin, $promotor, $event] = $this->context();
        $otherEvent = Event::withoutGlobalScopes()->create([
            'tenant_id' => $event->tenant_id,
            'user_id' => $promotor->id,
            'title' => 'Cancelled Event',
            'slug' => 'cancelled-event',
            'venue' => 'Venue',
            'city' => 'Bandung',
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(10)->addHours(2),
            'status' => 'cancelled',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/super-admin/events?status=approved&search=Platform')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.id', $event->id)
            ->assertJsonMissing(['id' => $otherEvent->id]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/super-admin/events')
            ->assertForbidden();
    }

    public function test_super_admin_orders_mask_buyer_pii_and_filter_by_status(): void
    {
        [$admin, $promotor, $event] = $this->context();
        $buyer = User::factory()->create();
        $paid = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $event->tenant_id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'total' => 105000,
            'status' => 'paid',
            'buyer_name' => 'Rina Pratama',
            'buyer_email' => 'rina.pratama@example.test',
            'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);
        Payment::create([
            'order_id' => $paid->id,
            'method' => 'qris',
            'provider' => 'midtrans',
            'external_id' => 'PAY-PAID',
            'amount' => 105000,
            'status' => 'success',
        ]);
        $pending = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $event->tenant_id,
            'subtotal' => 100000,
            'admin_fee' => 5000,
            'total' => 105000,
            'status' => 'pending',
            'buyer_name' => 'Other Buyer',
            'buyer_email' => 'other@example.test',
            'buyer_phone' => '089999999999',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/super-admin/orders?status=paid&search=Rina')
            ->assertOk()
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.id', $paid->id)
            ->assertJsonPath('data.data.0.buyer.name', 'R*** P******')
            ->assertJsonPath('data.data.0.buyer.email', 'r***********@example.test')
            ->assertJsonPath('data.data.0.buyer.phone', '********7890')
            ->assertJsonMissing(['id' => $pending->id])
            ->assertJsonMissing(['buyer_email' => 'rina.pratama@example.test']);

        $this->assertSame($paid->id, $response->json('data.data.0.id'));
    }

    private function context(): array
    {
        Role::findOrCreate('promotor');
        Role::findOrCreate('super_admin');
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        $promotor->assignRole('promotor');
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'title' => 'Platform Event',
            'slug' => 'platform-event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addDays(14),
            'end_date' => now()->addDays(14)->addHours(2),
            'status' => 'approved',
        ]);

        return [$admin, $promotor, $event];
    }
}

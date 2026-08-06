<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\ScanLog;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_report_returns_payout_and_attendance_without_buyer_pii(): void
    {
        [$promotor, $event, $ticket] = $this->context();
        $order = $this->paidOrder($promotor, $event, 100000, 5000, 'buyer@example.test');
        $item = $order->items()->create([
            'ticket_id' => $ticket->id,
            'quantity' => 1,
            'price' => 100000,
            'qr_code' => 'QR-'.str()->upper(str()->random(24)),
        ]);
        ScanLog::create([
            'order_item_id' => $item->id,
            'event_id' => $event->id,
            'scanned_by' => $promotor->id,
            'scan_status' => 'valid',
            'scanned_at' => now(),
        ]);

        $response = $this->actingAs($promotor, 'sanctum')->getJson('/api/promotor/reports?days=30');

        $response->assertOk()
            ->assertJsonPath('data.summary.ticket_revenue', 100000)
            ->assertJsonPath('data.summary.platform_commission', 5000)
            ->assertJsonPath('data.summary.promotor_payout', 95000)
            ->assertJsonPath('data.attendance.checked_in', 1)
            ->assertJsonMissing(['buyer_email' => 'buyer@example.test']);
    }

    public function test_promotor_csv_export_excludes_buyer_contact_details(): void
    {
        [$promotor, $event] = $this->context();
        $this->paidOrder($promotor, $event, 50000, 2500, 'private@example.test');

        $response = $this->actingAs($promotor, 'sanctum')
            ->get('/api/promotor/reports/export?days=30&format=csv');

        $response->assertOk();
        $this->assertStringContainsString('Kode Order', $response->streamedContent());
        $this->assertStringNotContainsString('private@example.test', $response->streamedContent());
    }

    public function test_super_admin_platform_report_aggregates_all_tenants(): void
    {
        [$promotor, $event] = $this->context();
        $this->paidOrder($promotor, $event, 80000, 4000, 'buyer@example.test');
        Role::findOrCreate('super_admin');
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/super-admin/reports/revenue?days=30')
            ->assertOk()
            ->assertJsonPath('data.summary.gmv', 85000)
            ->assertJsonPath('data.summary.platform_commission', 4000)
            ->assertJsonPath('data.summary.promotor_payout', 76000);
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
        $ticket = Ticket::create([
            'event_id' => $event->id,
            'name' => 'Regular',
            'price' => 100000,
            'quota' => 100,
        ]);

        return [$promotor, $event, $ticket];
    }

    private function paidOrder(User $promotor, Event $event, int $subtotal, int $commission, string $email): Order
    {
        $buyer = User::factory()->create();

        return Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $promotor->tenant_id,
            'subtotal' => $subtotal,
            'admin_fee' => 5000,
            'discount' => 0,
            'commission_fee' => $commission,
            'total' => $subtotal + 5000,
            'status' => 'paid',
            'buyer_name' => 'Buyer',
            'buyer_email' => $email,
            'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);
    }
}

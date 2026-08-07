<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class WithdrawalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_view_balance(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/withdraw/balance')
            ->assertOk()
            ->assertJsonPath('data.net_balance', 100000)
            ->assertJsonPath('data.available_balance', 100000);
    }

    public function test_promotor_can_request_withdrawal(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $response = $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/withdraw/requests', $this->withdrawData())
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', '50000.00');

        $this->assertDatabaseHas('withdrawals', [
            'id' => $response->json('data.id'),
            'tenant_id' => $promotor->tenant_id,
            'status' => 'pending',
        ]);
    }

    public function test_promotor_cannot_withdraw_more_than_available_balance(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/withdraw/requests', $this->withdrawData(200000))
            ->assertUnprocessable();
    }

    public function test_promotor_cannot_request_withdrawal_below_minimum(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/withdraw/requests', $this->withdrawData(5000))
            ->assertUnprocessable();
    }

    public function test_super_admin_can_approve_and_complete_withdrawal(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $withdrawal = Withdrawal::create($this->withdrawalRecord($promotor));

        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/super-admin/withdrawals/{$withdrawal->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/super-admin/withdrawals/{$withdrawal->id}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/withdraw/balance')
            ->assertOk()
            ->assertJsonPath('data.available_balance', 50000)
            ->assertJsonPath('data.withdrawn', 50000);
    }

    public function test_super_admin_can_reject_and_release_balance(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $withdrawal = Withdrawal::create($this->withdrawalRecord($promotor));

        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/super-admin/withdrawals/{$withdrawal->id}/reject", ['note' => 'Rekening tidak valid'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/withdraw/balance')
            ->assertOk()
            ->assertJsonPath('data.available_balance', 100000)
            ->assertJsonPath('data.reserved', 0);
    }

    public function test_pending_withdrawal_reserves_balance(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);
        Withdrawal::create($this->withdrawalRecord($promotor));

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/withdraw/balance')
            ->assertOk()
            ->assertJsonPath('data.available_balance', 50000)
            ->assertJsonPath('data.reserved', 50000);
    }

    public function test_promotor_can_cancel_pending_withdrawal(): void
    {
        [$promotor, $order] = $this->context();
        $order->update(['status' => 'paid', 'paid_at' => now()]);
        $withdrawal = Withdrawal::create($this->withdrawalRecord($promotor));

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/withdraw/requests/{$withdrawal->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/withdraw/balance')
            ->assertOk()
            ->assertJsonPath('data.available_balance', 100000);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/promotor/withdraw/balance')->assertStatus(401);
        $this->getJson('/api/super-admin/withdrawals')->assertStatus(401);
    }

    public function test_promotor_cannot_access_other_tenant_withdrawal(): void
    {
        [$promotor] = $this->context();
        $suffix = str()->lower(str()->random(10));
        $other = Tenant::create(['name' => 'Other '.$suffix, 'slug' => 'other-'.$suffix, 'email' => "other{$suffix}@example.test", 'status' => 'active']);
        $otherPromotor = User::factory()->create(['tenant_id' => $other->id]);
        $otherPromotor->assignRole('promotor');
        $withdrawal = Withdrawal::create($this->withdrawalRecord($otherPromotor));

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/withdraw/requests/{$withdrawal->id}/cancel")
            ->assertNotFound();
    }

    private function withdrawalRecord(User $promotor): array
    {
        return [
            'tenant_id' => $promotor->tenant_id,
            'requested_by' => $promotor->id,
            'code' => 'WDL-TEST-'.str()->random(8),
            'amount' => 50000,
            'status' => 'pending',
            'bank_name' => 'BCA',
            'bank_account_name' => 'Promotor',
            'bank_account_number' => '1234567890',
            'requested_at' => now(),
        ];
    }

    private function withdrawData(int $amount = 50000): array
    {
        return [
            'amount' => $amount,
            'bank_name' => 'BCA',
            'bank_account_name' => 'Promotor',
            'bank_account_number' => '1234567890',
            'note' => 'Tarik dana event.',
        ];
    }

    private function admin(): User
    {
        Role::findOrCreate('super_admin');
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        return $admin;
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
        $ticket = Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 100000,
            'admin_fee' => 0,
            'commission_fee' => 0,
            'discount' => 0,
            'total' => 100000,
            'status' => 'pending',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
        ]);
        $order->items()->create(['ticket_id' => $ticket->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 100000, 'status' => 'pending']);

        return [$promotor, $order];
    }
}

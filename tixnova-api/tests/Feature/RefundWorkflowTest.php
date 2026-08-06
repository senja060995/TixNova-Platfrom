<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ReferralCode;
use App\Models\ReferralReward;
use App\Models\Refund;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RefundWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_request_refund_before_cutoff_and_promotor_can_approve(): void
    {
        [$buyer, $promotor, $order] = $this->context();

        $response = $this->actingAs($buyer, 'sanctum')->postJson("/api/user/orders/{$order->order_code}/refunds", $this->refundData());
        $response->assertCreated()->assertJsonPath('data.status', 'requested')->assertJsonPath('data.amount', '90000.00');

        $refund = Refund::firstOrFail();
        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/refunds/{$refund->id}/review", ['approved' => true])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_event_cancellation_auto_approves_refund_and_manual_confirmation_reverses_inventory_and_referral(): void
    {
        [$buyer, $promotor, $order, $ticket] = $this->context(['event_status' => 'cancelled']);
        Role::findOrCreate('super_admin');
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');
        $code = ReferralCode::create(['user_id' => $promotor->id, 'code' => 'REF-REFUND', 'commission_rate' => 2, 'total_used' => 1, 'total_earned' => 1800]);
        $order->update(['referral_code' => $code->code]);
        ReferralReward::create(['referral_code_id' => $code->id, 'order_id' => $order->id, 'referrer_id' => $promotor->id, 'commission_rate' => 2, 'amount' => 1800, 'earned_at' => now()]);

        $this->actingAs($buyer, 'sanctum')->postJson("/api/user/orders/{$order->order_code}/refunds", $this->refundData())->assertCreated()->assertJsonPath('data.status', 'approved');
        $refund = Refund::firstOrFail();
        $this->actingAs($admin, 'sanctum')->postJson("/api/super-admin/refunds/{$refund->id}/process")->assertOk()->assertJsonPath('data.status', 'manual_required');
        $this->actingAs($admin, 'sanctum')->postJson("/api/super-admin/refunds/{$refund->id}/confirm-manual")->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'refunded']);
        $this->assertDatabaseHas('payments', ['order_id' => $order->id, 'status' => 'refunded', 'refund_amount' => 90000]);
        $this->assertDatabaseHas('refunds', ['id' => $refund->id, 'status' => 'refunded']);
        $this->assertDatabaseHas('referral_rewards', ['order_id' => $order->id, 'reversal_reason' => 'refund_confirmed']);
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'sold' => 1]);
    }

    public function test_refund_is_rejected_when_ticket_has_been_checked_in(): void
    {
        [$buyer, , $order] = $this->context();
        $order->items()->update(['qr_used' => true, 'qr_used_at' => now()]);

        $this->actingAs($buyer, 'sanctum')
            ->postJson("/api/user/orders/{$order->order_code}/refunds", $this->refundData())
            ->assertUnprocessable();
    }

    private function context(array $state = []): array
    {
        Role::findOrCreate('promotor');
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create(['name' => 'Tenant '.$suffix, 'slug' => 'tenant-'.$suffix, 'email' => "{$suffix}@example.test", 'status' => 'active']);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        $promotor->assignRole('promotor');
        $buyer = User::factory()->create();
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id, 'user_id' => $promotor->id, 'title' => 'Event '.$suffix, 'slug' => 'event-'.$suffix,
            'venue' => 'Venue', 'city' => 'Jakarta', 'start_date' => now()->addDays(14), 'end_date' => now()->addDays(14)->addHours(2),
            'status' => $state['event_status'] ?? 'approved',
        ]);
        $ticket = Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10, 'sold' => 1]);
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id, 'event_id' => $event->id, 'tenant_id' => $tenant->id, 'subtotal' => 100000, 'discount' => 10000,
            'admin_fee' => 5000, 'total' => 95000, 'status' => 'paid', 'buyer_name' => 'Buyer', 'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890', 'paid_at' => now(),
        ]);
        $order->items()->create(['ticket_id' => $ticket->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'va', 'provider' => 'midtrans', 'provider_payment_type' => 'bank_transfer', 'amount' => 95000, 'status' => 'success']);

        return [$buyer, $promotor, $order, $ticket];
    }

    private function refundData(): array
    {
        return [
            'reason' => 'Tidak dapat menghadiri event karena jadwal berubah.',
            'bank_name' => 'BCA',
            'bank_account_name' => 'Buyer',
            'bank_account_number' => '1234567890',
        ];
    }
}

<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ReferralCode;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ReferralTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_referred_order_creates_reward_once(): void
    {
        [$referrer, $buyer, $order] = $this->context();
        $code = ReferralCode::create([
            'user_id' => $referrer->id,
            'code' => 'REF-TEST123',
            'commission_rate' => 2,
        ]);
        $order->update(['referral_code' => $code->code]);

        $service = app(ReferralService::class);
        $service->rewardPaidOrder($order);
        $service->rewardPaidOrder($order);

        $this->assertDatabaseHas('referral_rewards', [
            'order_id' => $order->id,
            'referrer_id' => $referrer->id,
            'amount' => 2000,
        ]);
        $this->assertDatabaseCount('referral_rewards', 1);
        $this->assertDatabaseHas('referral_codes', ['id' => $code->id, 'total_used' => 1, 'total_earned' => 2000]);
    }

    public function test_user_can_view_own_referral_dashboard(): void
    {
        [$referrer] = $this->context();

        $this->actingAs($referrer, 'sanctum')
            ->getJson('/api/user/referrals')
            ->assertOk()
            ->assertJsonPath('data.code', $referrer->referral_code)
            ->assertJsonPath('data.total_used', 0);
    }

    public function test_self_referral_is_rejected(): void
    {
        [$referrer] = $this->context();

        $this->expectException(ValidationException::class);
        app(ReferralService::class)->attach($referrer->referral_code, $referrer);
    }

    private function context(): array
    {
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
        ]);
        $referrer = User::factory()->create(['referral_code' => 'REF-USER123']);
        $buyer = User::factory()->create();
        $organizer = User::factory()->create(['tenant_id' => $tenant->id]);
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
            'discount' => 0,
            'total' => 105000,
            'status' => 'paid',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'paid_at' => now(),
        ]);
        $order->items()->create(['ticket_id' => $ticket->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
        Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);

        return [$referrer, $buyer, $order];
    }
}

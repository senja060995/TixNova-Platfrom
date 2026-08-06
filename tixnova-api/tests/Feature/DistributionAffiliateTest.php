<?php

namespace Tests\Feature;

use App\Models\DistributionLink;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ReferralCode;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DistributionAffiliateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_activate_affiliate(): void
    {
        $user = User::factory()->create(['referral_code' => 'REF-AFF001']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/user/referrals/activate-affiliate')
            ->assertOk();

        $response->assertJsonPath('data.is_affiliate', true);
        $this->assertDatabaseHas('referral_codes', [
            'user_id' => $user->id,
            'is_affiliate' => true,
        ]);
    }

    public function test_user_can_create_and_list_distribution_links(): void
    {
        $user = User::factory()->create(['referral_code' => 'REF-LNK001']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/user/distribution-links', [
                'label' => 'Bio Instagram',
                'source' => 'ig-bio',
            ])
            ->assertCreated()
            ->assertJsonPath('data.label', 'Bio Instagram')
            ->assertJsonPath('data.source', 'ig-bio');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/user/distribution-links')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.clicks', 0);
    }

    public function test_link_redirect_tracks_click(): void
    {
        $user = User::factory()->create(['referral_code' => 'REF-RED001']);
        $code = ReferralCode::create(['user_id' => $user->id, 'code' => 'REF-RED001']);
        $link = DistributionLink::create([
            'user_id' => $user->id,
            'referral_code_id' => $code->id,
            'label' => 'TikTok',
            'code' => 'LNK-RED001',
            'source' => 'tiktok',
        ]);

        $this->getJson('/api/r/LNK-RED001')
            ->assertOk()
            ->assertJsonPath('data.code', 'LNK-RED001')
            ->assertJsonPath('data.clicks', 1)
            ->assertJsonPath('data.redirect_to', fn ($url) => str_contains($url, 'ref=REF-RED001'));

        $this->assertDatabaseHas('distribution_links', ['id' => $link->id, 'clicks' => 1]);
    }

    public function test_unknown_link_returns_404(): void
    {
        $this->getJson('/api/r/LNK-TIDAK-ADA')->assertNotFound();
    }

    public function test_payout_marks_pending_rewards_paid(): void
    {
        [$referrer, $buyer, $order] = $this->context();
        $code = ReferralCode::create([
            'user_id' => $referrer->id,
            'code' => 'REF-PAY001',
            'commission_rate' => 2,
        ]);
        $order->update(['referral_code' => $code->code]);

        $service = app(ReferralService::class);
        $service->rewardPaidOrder($order);

        $this->assertDatabaseHas('referral_rewards', [
            'order_id' => $order->id,
            'status' => 'pending',
            'amount' => 2000,
        ]);

        $this->actingAs($referrer, 'sanctum')
            ->postJson('/api/user/referrals/payout')
            ->assertOk()
            ->assertJsonPath('data.paid', 1)
            ->assertJsonPath('data.amount', 2000);

        $this->assertDatabaseHas('referral_rewards', [
            'order_id' => $order->id,
            'status' => 'paid',
        ]);
    }

    public function test_dashboard_reports_affiliate_and_payout_totals(): void
    {
        [$referrer, $buyer, $order] = $this->context();
        $code = ReferralCode::create([
            'user_id' => $referrer->id,
            'code' => 'REF-DASH1',
            'commission_rate' => 2,
        ]);
        $order->update(['referral_code' => $code->code]);

        $service = app(ReferralService::class);
        $service->rewardPaidOrder($order);
        $service->payout($referrer);

        $this->actingAs($referrer, 'sanctum')
            ->getJson('/api/user/referrals')
            ->assertOk()
            ->assertJsonPath('data.pending_amount', 0)
            ->assertJsonPath('data.paid_amount', 2000)
            ->assertJsonPath('data.total_earned', 2000)
            ->assertJsonPath('data.recent_rewards.0.status', 'paid');
    }

    public function test_order_stores_distribution_source(): void
    {
        $suffix = str()->lower(str()->random(8));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
        ]);
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
        $buyer = User::factory()->create();

        $this->actingAs($buyer, 'sanctum')
            ->postJson('/api/orders', [
                'event_id' => $event->id,
                'items' => [
                    ['ticket_id' => $ticket->id, 'quantity' => 1],
                ],
                'payment_method' => 'qris',
                'buyer_name' => 'Buyer',
                'buyer_email' => 'buyer@example.test',
                'buyer_phone' => '081234567890',
                'source' => 'ig-bio',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('orders', [
            'source' => 'ig-bio',
            'status' => 'pending',
        ]);
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

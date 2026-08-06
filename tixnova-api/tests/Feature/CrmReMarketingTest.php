<?php

namespace Tests\Feature;

use App\Jobs\SendCrmCampaign;
use App\Mail\ReMarketingMail;
use App\Models\Category;
use App\Models\CrmCampaign;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CrmReMarketingTest extends TestCase
{
    use RefreshDatabase;

    public function test_promotor_can_create_and_preview_campaign(): void
    {
        [$tenant, $event, $promotor] = $this->context();
        $this->buyerWithOrder($tenant, $event, 2, now()->subDays(4));

        $response = $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/crm/campaigns', [
                'name' => 'Sosialisasi Event Baru',
                'segment' => 'repeat',
                'subject' => 'Jangan lewatkan konser berikutnya',
                'message' => 'Halo, kami punya event spesial untuk Anda.',
                'event_id' => $event->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft');

        $id = $response->json('data.id');

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/crm/campaigns/preview', ['segment' => 'repeat'])
            ->assertOk()
            ->assertJsonPath('data.recipients_count', 1)
            ->assertJsonCount(1, 'data.sample');

        $this->actingAs($promotor, 'sanctum')
            ->getJson('/api/promotor/crm/campaigns')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $id);
    }

    public function test_sending_campaign_dispatches_mail_to_segment(): void
    {
        Mail::fake();
        Queue::fake();

        [$tenant, $event, $promotor] = $this->context();
        $buyer = $this->buyerWithOrder($tenant, $event, 1, now()->subDays(3));

        $campaign = CrmCampaign::create([
            'tenant_id' => $tenant->id,
            'name' => 'Kampanye',
            'segment' => 'first_timer',
            'channel' => 'email',
            'subject' => 'Event serupa untuk Anda',
            'message' => 'Lihat event serupa berikutnya.',
            'event_id' => $event->id,
            'status' => 'draft',
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/crm/campaigns/{$campaign->id}/send")
            ->assertOk()
            ->assertJsonPath('message', 'Kampanye sedang dikirim ke segmen target.');

        Queue::assertPushed(SendCrmCampaign::class);
    }

    public function test_send_campaign_marks_sent_and_records_recipients(): void
    {
        Mail::fake();

        [$tenant, $event, $promotor] = $this->context();
        $buyer = $this->buyerWithOrder($tenant, $event, 1, now()->subDays(3));

        $campaign = CrmCampaign::create([
            'tenant_id' => $tenant->id,
            'name' => 'Kampanye',
            'segment' => 'first_timer',
            'channel' => 'email',
            'subject' => 'Event serupa untuk Anda',
            'message' => 'Lihat event serupa berikutnya.',
            'event_id' => $event->id,
            'status' => 'draft',
        ]);

        SendCrmCampaign::dispatchSync($campaign->id);

        $this->assertDatabaseHas('crm_campaigns', [
            'id' => $campaign->id,
            'status' => 'sent',
            'recipients_count' => 1,
        ]);
        Mail::assertQueued(ReMarketingMail::class, fn (ReMarketingMail $mail) => $mail->hasTo($buyer->email));
    }

    public function test_cannot_send_twice_or_delete_sent_campaign(): void
    {
        Mail::fake();

        [$tenant, $event, $promotor] = $this->context();
        $this->buyerWithOrder($tenant, $event, 1, now()->subDays(3));

        $campaign = CrmCampaign::create([
            'tenant_id' => $tenant->id,
            'name' => 'Kampanye',
            'segment' => 'first_timer',
            'channel' => 'email',
            'subject' => 'Event serupa untuk Anda',
            'message' => 'Lihat event serupa berikutnya.',
            'event_id' => $event->id,
            'status' => 'draft',
        ]);

        SendCrmCampaign::dispatchSync($campaign->id);

        $this->actingAs($promotor, 'sanctum')
            ->postJson("/api/promotor/crm/campaigns/{$campaign->id}/send")
            ->assertStatus(422);

        $this->actingAs($promotor, 'sanctum')
            ->deleteJson("/api/promotor/crm/campaigns/{$campaign->id}")
            ->assertStatus(422);
    }

    public function test_draft_can_be_deleted_and_invalid_segment_rejected(): void
    {
        [$tenant, $event, $promotor] = $this->context();

        $campaign = CrmCampaign::create([
            'tenant_id' => $tenant->id,
            'name' => 'Kampanye',
            'segment' => 'vip',
            'channel' => 'email',
            'subject' => 'Event VIP',
            'message' => 'Khusus untuk Anda.',
            'event_id' => $event->id,
            'status' => 'draft',
        ]);

        $this->actingAs($promotor, 'sanctum')
            ->deleteJson("/api/promotor/crm/campaigns/{$campaign->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Kampanye dihapus.');

        $this->actingAs($promotor, 'sanctum')
            ->postJson('/api/promotor/crm/campaigns', [
                'name' => 'X',
                'segment' => 'bukan_segmen',
                'subject' => 'X',
                'message' => 'X',
            ])
            ->assertStatus(422);
    }

    private function context(): array
    {
        $suffix = str()->lower(str()->random(8));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
            'status' => 'active',
        ]);
        $promotor = User::factory()->create(['tenant_id' => $tenant->id]);
        Role::findOrCreate('promotor');
        $promotor->assignRole('promotor');
        $category = Category::create([
            'name' => 'Konser',
            'slug' => 'konser',
            'type' => 'event',
            'is_active' => true,
        ]);
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $promotor->id,
            'category_id' => $category->id,
            'title' => 'Event '.$suffix,
            'slug' => 'event-'.$suffix,
            'venue' => 'Venue',
            'city' => 'Jakarta',
            'start_date' => now()->addWeek(),
            'end_date' => now()->addWeek()->addHours(2),
            'status' => 'approved',
        ]);
        Ticket::create(['event_id' => $event->id, 'name' => 'Regular', 'price' => 100000, 'quota' => 10]);

        return [$tenant, $event, $promotor];
    }

    private function buyerWithOrder(Tenant $tenant, Event $event, int $count, $paidAt): User
    {
        $buyer = User::factory()->create();

        for ($i = 0; $i < $count; $i++) {
            $order = Order::withoutGlobalScopes()->create([
                'user_id' => $buyer->id,
                'event_id' => $event->id,
                'tenant_id' => $tenant->id,
                'subtotal' => 100000,
                'admin_fee' => 5000,
                'commission_fee' => 5000,
                'discount' => 0,
                'total' => 105000,
                'status' => 'paid',
                'buyer_name' => 'Buyer',
                'buyer_email' => 'buyer@example.test',
                'buyer_phone' => '081234567890',
                'paid_at' => $paidAt,
            ]);
            $order->items()->create(['ticket_id' => $event->tickets()->first()->id, 'quantity' => 1, 'price' => 100000, 'qr_code' => 'QR-'.str()->random(24)]);
            Payment::create(['order_id' => $order->id, 'method' => 'qris', 'provider' => 'midtrans', 'amount' => 105000, 'status' => 'success']);
        }

        return $buyer;
    }
}

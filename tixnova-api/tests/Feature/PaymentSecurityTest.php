<?php

namespace Tests\Feature;

use App\Jobs\SendEticket;
use App\Models\Event;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PaymentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_requires_authentication(): void
    {
        $this->postJson('/api/orders', [])->assertUnauthorized();
    }

    public function test_valid_midtrans_settlement_converts_reservation_once(): void
    {
        config()->set('services.midtrans.server_key', 'server-key');
        Queue::fake();

        [$order, $payment, $ticket] = $this->pendingOrder();
        $payload = [
            'order_id' => $payment->external_id,
            'status_code' => '200',
            'gross_amount' => '55000.00',
            'transaction_status' => 'settlement',
            'transaction_id' => 'transaction-1',
        ];
        $payload['signature_key'] = hash('sha512', $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'server-key');

        $this->postJson('/api/webhooks/midtrans', $payload)->assertOk();
        $this->postJson('/api/webhooks/midtrans', $payload)->assertOk();

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
        $this->assertDatabaseHas('payments', ['id' => $payment->id, 'status' => 'success']);
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'sold' => 1, 'reserved' => 0]);
        $this->assertDatabaseCount('payment_webhook_events', 1);
        Queue::assertPushed(SendEticket::class, 1);
    }

    public function test_midtrans_webhook_rejects_invalid_signature(): void
    {
        config()->set('services.midtrans.server_key', 'server-key');

        [, $payment, $ticket] = $this->pendingOrder();

        $this->postJson('/api/webhooks/midtrans', [
            'order_id' => $payment->external_id,
            'status_code' => '200',
            'gross_amount' => '55000.00',
            'transaction_status' => 'settlement',
            'signature_key' => 'invalid',
        ])->assertForbidden();

        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'sold' => 0, 'reserved' => 1]);
    }

    private function pendingOrder(): array
    {
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::query()->create([
            'name' => 'Tenant Test',
            'slug' => 'tenant-test-'.$suffix,
            'email' => "tenant-{$suffix}@example.test",
        ]);
        $organizer = User::factory()->create(['tenant_id' => $tenant->id]);
        $buyer = User::factory()->create();
        $event = Event::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'user_id' => $organizer->id,
            'title' => 'Event Test',
            'slug' => 'event-test-'.str()->lower(str()->random(10)),
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
            'quota' => 10,
            'sold' => 0,
            'reserved' => 1,
        ]);
        $order = Order::withoutGlobalScopes()->create([
            'user_id' => $buyer->id,
            'event_id' => $event->id,
            'tenant_id' => $tenant->id,
            'subtotal' => 50000,
            'admin_fee' => 5000,
            'discount' => 0,
            'total' => 55000,
            'status' => 'pending',
            'buyer_name' => 'Buyer',
            'buyer_email' => 'buyer@example.test',
            'buyer_phone' => '081234567890',
            'expired_at' => now()->addMinutes(15),
        ]);
        $order->items()->create([
            'ticket_id' => $ticket->id,
            'quantity' => 1,
            'price' => 50000,
            'qr_code' => 'QR-'.str()->random(24),
        ]);
        $payment = Payment::create([
            'order_id' => $order->id,
            'method' => 'qris',
            'provider' => 'midtrans',
            'external_id' => $order->order_code.'-PAYMENT',
            'amount' => 55000,
            'status' => 'pending',
            'expired_at' => $order->expired_at,
        ]);

        return [$order, $payment, $ticket];
    }
}

<?php

namespace Tests\Feature;

use App\Jobs\SendEticket;
use App\Mail\EticketMail;
use App\Models\Event;
use App\Models\Order;
use App\Models\Seat;
use App\Models\SeatMap;
use App\Models\Tenant;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EticketFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_order_email_is_sent_once_and_items_are_marked_delivered(): void
    {
        Mail::fake();
        $order = $this->paidOrder();

        (new SendEticket($order->id))->handle();
        (new SendEticket($order->id))->handle();

        Mail::assertQueued(EticketMail::class, 1);
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'eticket_sent' => true,
        ]);
    }

    public function test_pending_order_does_not_send_eticket(): void
    {
        Mail::fake();
        $order = $this->paidOrder();
        $order->update(['status' => 'pending']);

        (new SendEticket($order->id))->handle();

        Mail::assertNothingSent();
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'eticket_sent' => false,
        ]);
    }

    public function test_eticket_includes_the_allocated_seat_label(): void
    {
        Mail::fake();
        $order = $this->paidOrder();
        $item = $order->items()->firstOrFail();
        $seatMap = SeatMap::create(['event_id' => $order->event_id, 'name' => 'Main Hall', 'is_published' => true]);
        $seat = Seat::create([
            'seat_map_id' => $seatMap->id,
            'ticket_id' => $item->ticket_id,
            'section' => 'VIP',
            'row_label' => 'A',
            'number' => 1,
            'label' => 'VIP-A1',
        ]);
        $item->update(['seat_id' => $seat->id, 'seat_number' => $seat->label]);

        (new SendEticket($order->id))->handle();

        Mail::assertQueued(EticketMail::class, function (EticketMail $mail) {
            $mail->assertSeeInHtml('VIP-A1');

            return true;
        });
    }

    public function test_eticket_html_has_branding_and_qr_code(): void
    {
        Mail::fake();
        $order = $this->paidOrder();

        (new SendEticket($order->id))->handle();

        Mail::assertQueued(EticketMail::class, function (EticketMail $mail) use ($order) {
            $html = $mail->render();

            $this->assertStringContainsString('Pembayaran Berhasil', $html);
            $this->assertStringContainsString('TixNova', $html);
            $this->assertStringContainsString('data:image/png;base64', $html);
            $this->assertStringContainsString($order->order_code, $html);

            return true;
        });
    }

    private function paidOrder(): Order
    {
        $suffix = str()->lower(str()->random(10));
        $tenant = Tenant::create([
            'name' => 'Tenant '.$suffix,
            'slug' => 'tenant-'.$suffix,
            'email' => "{$suffix}@example.test",
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
        $ticket = Ticket::create([
            'event_id' => $event->id,
            'name' => 'Regular',
            'price' => 50000,
            'quota' => 10,
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
        $order->items()->create([
            'ticket_id' => $ticket->id,
            'quantity' => 1,
            'price' => 50000,
            'attendee_name' => 'Attendee',
            'qr_code' => 'QR-'.str()->upper(str()->random(24)),
        ]);

        return $order;
    }
}

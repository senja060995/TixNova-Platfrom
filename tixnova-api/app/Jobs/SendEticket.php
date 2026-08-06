<?php

namespace App\Jobs;

use App\Mail\EticketMail;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendEticket implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(public int $orderId) {}

    public function handle(): void
    {
        $order = Order::withoutGlobalScopes()
            ->with(['event', 'items.ticket', 'items.seat'])
            ->findOrFail($this->orderId);

        if ($order->status !== 'paid' || blank($order->buyer_email) || $order->items->every->eticket_sent) {
            return;
        }

        Mail::to($order->buyer_email)->send(new EticketMail($order));

        DB::transaction(function () use ($order) {
            OrderItem::where('order_id', $order->id)
                ->where('eticket_sent', false)
                ->lockForUpdate()
                ->update([
                    'eticket_sent' => true,
                    'eticket_sent_at' => now(),
                ]);
        });
    }
}

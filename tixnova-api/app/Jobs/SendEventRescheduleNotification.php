<?php

namespace App\Jobs;

use App\Mail\EventRescheduledMail;
use App\Models\EventReschedule;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEventRescheduleNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(public int $rescheduleId) {}

    public function handle(): void
    {
        $reschedule = EventReschedule::with('event')->findOrFail($this->rescheduleId);

        Order::withoutGlobalScopes()
            ->where('event_id', $reschedule->event_id)
            ->where('status', 'paid')
            ->whereNotNull('buyer_email')
            ->select('buyer_email')
            ->distinct()
            ->orderBy('buyer_email')
            ->each(fn (Order $order) => Mail::to($order->buyer_email)->send(new EventRescheduledMail($reschedule)));
    }
}

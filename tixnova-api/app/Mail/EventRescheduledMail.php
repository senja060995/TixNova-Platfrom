<?php

namespace App\Mail;

use App\Models\EventReschedule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EventRescheduledMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public EventReschedule $reschedule) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Perubahan Jadwal: {$this->reschedule->event->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.event-rescheduled',
        );
    }
}

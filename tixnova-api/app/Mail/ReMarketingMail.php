<?php

namespace App\Mail;

use App\Models\CrmCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReMarketingMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public CrmCampaign $campaign) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->campaign->subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.re-marketing',
        );
    }
}

<?php

namespace App\Jobs;

use App\Mail\ReMarketingMail;
use App\Models\CrmCampaign;
use App\Services\CrmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendCrmCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(public int $campaignId) {}

    public function handle(CrmService $crm): void
    {
        $campaign = CrmCampaign::with('event.tickets')->find($this->campaignId);

        if (! $campaign || ! $campaign->isDraft()) {
            return;
        }

        $recipients = $crm->segmentBuyers($campaign->tenant_id, $campaign->segment);

        foreach ($recipients as $recipient) {
            Mail::to($recipient['email'], $recipient['name'])->send(new ReMarketingMail($campaign));
        }

        $campaign->forceFill([
            'status' => 'sent',
            'recipients_count' => count($recipients),
            'sent_at' => now(),
        ])->save();
    }
}

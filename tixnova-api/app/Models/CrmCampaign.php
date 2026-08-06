<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmCampaign extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id', 'name', 'segment', 'channel', 'subject',
        'message', 'event_id', 'status', 'recipients_count', 'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityEvent extends Model
{
    protected $fillable = [
        'community_id', 'event_id', 'revenue_share_pct',
    ];

    protected $casts = [
        'revenue_share_pct' => 'decimal:2',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

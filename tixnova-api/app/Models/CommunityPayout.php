<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityPayout extends Model
{
    protected $fillable = [
        'tenant_id', 'community_id', 'order_id', 'event_id',
        'share_pct', 'amount', 'status', 'earned_at', 'reversed_at',
    ];

    protected $casts = [
        'share_pct' => 'decimal:2',
        'amount' => 'decimal:2',
        'earned_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

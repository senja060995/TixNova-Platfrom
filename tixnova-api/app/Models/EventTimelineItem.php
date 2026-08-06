<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventTimelineItem extends Model
{
    protected $fillable = [
        'event_id', 'tenant_id', 'title', 'description', 'due_at',
        'status', 'completed_at', 'sort_order',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

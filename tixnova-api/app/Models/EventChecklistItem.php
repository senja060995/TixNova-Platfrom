<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventChecklistItem extends Model
{
    protected $fillable = [
        'event_id', 'tenant_id', 'title', 'phase', 'is_done', 'completed_at', 'sort_order',
    ];

    protected $casts = [
        'is_done' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

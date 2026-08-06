<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventReschedule extends Model
{
    protected $attributes = [
        'status' => 'requested',
    ];

    protected $fillable = [
        'event_id', 'requested_by', 'reviewed_by', 'previous_start_date', 'previous_end_date',
        'new_start_date', 'new_end_date', 'reason', 'status', 'review_note', 'reviewed_at',
    ];

    protected $casts = [
        'previous_start_date' => 'datetime',
        'previous_end_date' => 'datetime',
        'new_start_date' => 'datetime',
        'new_end_date' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}

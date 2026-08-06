<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventContentTranslation extends Model
{
    protected $fillable = [
        'event_id', 'locale', 'title', 'description', 'short_desc', 'venue_detail',
        'meta_title', 'meta_description', 'tags', 'status', 'published_at',
    ];

    protected $casts = [
        'tags' => 'array',
        'published_at' => 'datetime',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

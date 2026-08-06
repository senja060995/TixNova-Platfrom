<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactEventDaily extends Model
{
    use HasFactory;

    protected $table = 'fact_event_daily';

    protected $fillable = [
        'tenant_id', 'event_id', 'snapshot_date',
        'sold_total', 'quota_total', 'sell_through_pct',
        'revenue_total', 'tickets_7d', 'days_to_event', 'computed_at',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'sold_total' => 'integer',
        'quota_total' => 'integer',
        'sell_through_pct' => 'integer',
        'revenue_total' => 'decimal:2',
        'tickets_7d' => 'integer',
        'days_to_event' => 'integer',
        'computed_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

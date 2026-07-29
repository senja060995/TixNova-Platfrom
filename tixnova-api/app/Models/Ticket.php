<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'event_id', 'name', 'type', 'description', 'price',
        'quota', 'sold', 'min_purchase', 'max_purchase',
        'sale_start', 'sale_end', 'includes', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'includes'   => 'array',
        'price'      => 'decimal:2',
        'sale_start' => 'datetime',
        'sale_end'   => 'datetime',
        'is_active'  => 'boolean',
    ];

    // ─── Relations ────────────────────────────────────────────

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function getAvailableQuota(): int
    {
        return $this->quota - $this->sold;
    }

    public function isAvailable(): bool
    {
        return $this->is_active
            && $this->getAvailableQuota() > 0
            && (is_null($this->sale_start) || now()->gte($this->sale_start))
            && (is_null($this->sale_end)   || now()->lte($this->sale_end));
    }
}

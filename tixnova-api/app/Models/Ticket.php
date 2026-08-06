<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'event_id', 'name', 'type', 'description', 'price',
        'early_bird_price', 'early_bird_quota', 'early_bird_end',
        'quota', 'sold', 'reserved', 'min_purchase', 'max_purchase',
        'sale_start', 'sale_end', 'includes', 'is_active', 'sort_order',
    ];

    protected $casts = [
        'includes' => 'array',
        'price' => 'decimal:2',
        'early_bird_price' => 'decimal:2',
        'early_bird_end' => 'datetime',
        'sale_start' => 'datetime',
        'sale_end' => 'datetime',
        'is_active' => 'boolean',
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

    public function seats(): HasMany
    {
        return $this->hasMany(Seat::class);
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function getAvailableQuota(): int
    {
        return $this->quota - $this->sold - $this->reserved;
    }

    public function isAvailable(): bool
    {
        return $this->is_active
            && $this->getAvailableQuota() > 0
            && (is_null($this->sale_start) || now()->gte($this->sale_start))
            && (is_null($this->sale_end) || now()->lte($this->sale_end));
    }

    public function earlyBirdActive(): bool
    {
        if (is_null($this->early_bird_price)) {
            return false;
        }
        if (! is_null($this->early_bird_end) && now()->gt($this->early_bird_end)) {
            return false;
        }
        if (! is_null($this->early_bird_quota)
            && ($this->sold + $this->reserved) >= $this->early_bird_quota) {
            return false;
        }

        return true;
    }

    public function currentPrice(): float
    {
        if ($this->earlyBirdActive()) {
            return (float) $this->early_bird_price;
        }

        return (float) $this->price;
    }
}

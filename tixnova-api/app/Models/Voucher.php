<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voucher extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id', 'event_id', 'campaign_id', 'code', 'type',
        'discount_type', 'discount_value', 'min_purchase', 'max_discount',
        'max_use', 'used_count', 'valid_from', 'valid_until', 'is_active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_purchase' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        if ($this->max_use && $this->used_count >= $this->max_use) {
            return false;
        }
        if ($this->valid_from && now()->lt($this->valid_from)) {
            return false;
        }
        if ($this->valid_until && now()->gt($this->valid_until)) {
            return false;
        }
        if ($this->campaign_id && ! $this->campaign?->isActive()) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $subtotal): float
    {
        if ($this->discount_type === 'percentage') {
            $discount = $subtotal * ($this->discount_value / 100);
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }

            return $discount;
        }

        return min($this->discount_value, $subtotal);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tenant extends Model
{
    protected $fillable = [
        'name', 'slug', 'email', 'phone', 'logo', 'description',
        'status', 'plan', 'commission', 'domain', 'settings',
        'approved_at', 'approved_by',
    ];

    protected $casts = [
        'settings'    => 'array',
        'commission'  => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    // ─── Relations ────────────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ─── Scopes ───────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}

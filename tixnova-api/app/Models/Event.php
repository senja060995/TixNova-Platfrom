<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasTenant, SoftDeletes;

    protected $fillable = [
        'tenant_id', 'user_id', 'category_id',
        'title', 'slug', 'description', 'short_desc',
        'venue', 'venue_detail', 'city', 'province',
        'latitude', 'longitude', 'start_date', 'end_date',
        'banner', 'poster', 'status', 'is_featured', 'is_free',
        'min_age', 'tags', 'meta_title', 'meta_description',
        'approved_at', 'approved_by', 'reject_reason',
    ];

    protected $casts = [
        'tags'        => 'array',
        'start_date'  => 'datetime',
        'end_date'    => 'datetime',
        'approved_at' => 'datetime',
        'is_featured' => 'boolean',
        'is_free'     => 'boolean',
        'latitude'    => 'decimal:8',
        'longitude'   => 'decimal:8',
    ];

    // ─── Relations ────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class)->orderBy('sort_order');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    // ─── Scopes ───────────────────────────────────────────────

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>', now())->where('status', 'approved');
    }

    public function scopeByCity($query, string $city)
    {
        return $query->where('city', $city);
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}

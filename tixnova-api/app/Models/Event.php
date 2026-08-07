<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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
        'tags' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'approved_at' => 'datetime',
        'is_featured' => 'boolean',
        'is_free' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    // ─── Media Helpers ────────────────────────────────────────

    public function bannerUrl(): Attribute
    {
        return Attribute::get(fn () => $this->resolveMediaUrl($this->banner));
    }

    public function posterUrl(): Attribute
    {
        return Attribute::get(fn () => $this->resolveMediaUrl($this->poster));
    }

    public function coverUrl(): Attribute
    {
        return Attribute::get(function () {
            return $this->resolveMediaUrl($this->banner)
                ?? $this->resolveMediaUrl($this->poster)
                ?? 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200';
        });
    }

    protected function resolveMediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', 'data:', 'cid:'])) {
            return $path;
        }

        return asset('storage/'.ltrim($path, '/'));
    }

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

    public function sponsorships(): HasMany
    {
        return $this->hasMany(Sponsorship::class);
    }

    public function vendorBookings(): HasMany
    {
        return $this->hasMany(VendorBooking::class);
    }

    public function rfqs(): HasMany
    {
        return $this->hasMany(Rfq::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function seatMap(): HasOne
    {
        return $this->hasOne(SeatMap::class);
    }

    public function reschedules(): HasMany
    {
        return $this->hasMany(EventReschedule::class);
    }

    public function budgetItems(): HasMany
    {
        return $this->hasMany(EventBudgetItem::class);
    }

    public function timelineItems(): HasMany
    {
        return $this->hasMany(EventTimelineItem::class);
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(EventChecklistItem::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(EventContentTranslation::class);
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

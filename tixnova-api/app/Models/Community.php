<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Community extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id', 'name', 'slug', 'code', 'type',
        'description', 'avatar', 'status', 'created_by',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members(): HasMany
    {
        return $this->hasMany(CommunityMember::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(CommunityEvent::class);
    }

    public function payouts(): HasMany
    {
        return $this->hasMany(CommunityPayout::class);
    }

    public function memberCount(): int
    {
        return $this->members()->count();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}

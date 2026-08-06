<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'status', 'budget',
        'valid_from', 'valid_until', 'created_by',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        return (is_null($this->valid_from) || now()->gte($this->valid_from))
            && (is_null($this->valid_until) || now()->lte($this->valid_until));
    }
}

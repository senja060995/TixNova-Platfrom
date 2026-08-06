<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralCode extends Model
{
    protected $fillable = [
        'user_id', 'code', 'commission_rate', 'total_used', 'total_earned', 'is_active', 'is_affiliate',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'total_earned' => 'decimal:2',
        'is_active' => 'boolean',
        'is_affiliate' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rewards(): HasMany
    {
        return $this->hasMany(ReferralReward::class);
    }

    public function distributionLinks(): HasMany
    {
        return $this->hasMany(DistributionLink::class);
    }
}

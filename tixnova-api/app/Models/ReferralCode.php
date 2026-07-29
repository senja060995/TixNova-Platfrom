<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralCode extends Model
{
    protected $fillable = [
        'user_id', 'code', 'commission_rate', 'total_used', 'total_earned', 'is_active',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'total_earned'    => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

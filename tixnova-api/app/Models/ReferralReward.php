<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralReward extends Model
{
    protected $fillable = [
        'referral_code_id', 'order_id', 'referrer_id', 'commission_rate', 'amount', 'status', 'paid_at', 'earned_at', 'reversed_at', 'reversal_reason',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'status' => 'string',
        'earned_at' => 'datetime',
        'paid_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function referralCode(): BelongsTo
    {
        return $this->belongsTo(ReferralCode::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }
}

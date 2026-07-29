<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id', 'method', 'provider', 'external_id',
        'payment_url', 'amount', 'status', 'payload_raw',
        'paid_at', 'expired_at',
        'refund_amount', 'refund_at', 'refund_reason',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'refund_amount'=> 'decimal:2',
        'payload_raw'  => 'array',
        'paid_at'      => 'datetime',
        'expired_at'   => 'datetime',
        'refund_at'    => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isSuccess(): bool
    {
        return $this->status === 'success';
    }
}

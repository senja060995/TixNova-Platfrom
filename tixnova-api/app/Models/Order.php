<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasTenant;

    protected $fillable = [
        'order_code', 'user_id', 'event_id', 'tenant_id', 'voucher_id',
        'referral_code', 'community_code', 'source', 'subtotal', 'discount', 'admin_fee',
        'commission_fee', 'total', 'status',
        'buyer_name', 'buyer_email', 'buyer_phone',
        'notes', 'expired_at', 'paid_at', 'cancelled_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'admin_fee' => 'decimal:2',
        'commission_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'expired_at' => 'datetime',
        'paid_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    // ─── Relations ────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class)->latest();
    }

    public function refund(): HasOne
    {
        return $this->hasOne(Refund::class);
    }

    // ─── Helpers ──────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired'
            || ($this->expired_at && $this->expired_at->isPast());
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_code)) {
                $order->order_code = 'TIX-'.date('Ymd').'-'.strtoupper(\Str::random(6));
            }
            if (empty($order->expired_at)) {
                $order->expired_at = now()->addHours(2);
            }
        });
    }
}

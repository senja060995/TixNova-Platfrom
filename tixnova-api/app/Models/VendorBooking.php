<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorBooking extends Model
{
    use HasTenant;

    public const STATUS_REQUESTED = 'requested';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_FULFILLED = 'fulfilled';

    public const STATUS_RELEASED = 'released';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'tenant_id', 'event_id', 'vendor_id', 'service', 'amount',
        'deposit_pct', 'deposit', 'status', 'notes', 'service_date', 'released_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'deposit_pct' => 'integer',
        'deposit' => 'decimal:2',
        'service_date' => 'date',
        'released_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}

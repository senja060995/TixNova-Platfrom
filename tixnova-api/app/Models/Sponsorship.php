<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sponsorship extends Model
{
    use HasTenant;

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_RELEASED = 'released';

    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'tenant_id', 'event_id', 'sponsor_id', 'package_name', 'amount',
        'poa_threshold_pct', 'status', 'terms', 'signed_at', 'released_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'poa_threshold_pct' => 'integer',
        'signed_at' => 'datetime',
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

    public function sponsor(): BelongsTo
    {
        return $this->belongsTo(Sponsor::class);
    }
}

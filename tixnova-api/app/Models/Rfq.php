<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rfq extends Model
{
    use HasTenant;

    public const STATUS_OPEN = 'open';

    public const STATUS_AWARDED = 'awarded';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'tenant_id', 'event_id', 'service', 'description',
        'budget', 'deadline', 'status',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'deadline' => 'date',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(RfqOffer::class)->orderBy('quote');
    }
}

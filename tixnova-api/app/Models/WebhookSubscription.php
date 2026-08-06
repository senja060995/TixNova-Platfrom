<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebhookSubscription extends Model
{
    use HasTenant;

    public const EVENT_ORDER_PAID = 'order.paid';

    public const EVENT_ORDER_REFUNDED = 'order.refunded';

    public static function eventTypes(): array
    {
        return [self::EVENT_ORDER_PAID, self::EVENT_ORDER_REFUNDED];
    }

    protected $fillable = [
        'tenant_id', 'name', 'event_type', 'target_url', 'signing_secret', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class, 'subscription_id');
    }
}

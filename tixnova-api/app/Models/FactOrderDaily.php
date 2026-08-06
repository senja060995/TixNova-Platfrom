<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactOrderDaily extends Model
{
    use HasFactory;

    protected $table = 'fact_order_daily';

    protected $fillable = [
        'tenant_id', 'event_id', 'sale_date',
        'orders_count', 'tickets_sold',
        'gross_amount', 'discount_amount', 'admin_fee', 'commission_fee', 'net_amount',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'orders_count' => 'integer',
        'tickets_sold' => 'integer',
        'gross_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'admin_fee' => 'decimal:2',
        'commission_fee' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}

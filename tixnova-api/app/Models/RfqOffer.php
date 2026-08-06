<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RfqOffer extends Model
{
    use HasTenant;

    protected $fillable = [
        'tenant_id', 'rfq_id', 'vendor_id', 'quote', 'message', 'is_winner',
    ];

    protected $casts = [
        'quote' => 'decimal:2',
        'is_winner' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(Rfq::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}

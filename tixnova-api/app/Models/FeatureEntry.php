<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureEntry extends Model
{
    protected $fillable = [
        'tenant_id', 'entity_type', 'entity_id', 'key', 'value', 'computed_at',
    ];

    protected $casts = [
        'value' => 'array',
        'computed_at' => 'datetime',
    ];
}

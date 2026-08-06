<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    use HasTenant;

    public const SCOPE_READ = 'read';

    public const SCOPE_WRITE = 'write';

    protected $fillable = [
        'tenant_id', 'name', 'prefix', 'key_hash', 'scopes',
        'is_active', 'expires_at', 'last_used_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function hasScope(string $scope): bool
    {
        return in_array($scope, explode(',', $this->scopes));
    }

    public function isUsable(): bool
    {
        return $this->is_active
            && (! $this->expires_at || $this->expires_at->isFuture());
    }
}

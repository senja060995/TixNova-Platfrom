<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasTenant
{
    /**
     * Boot the trait — automatically inject tenant_id on create
     * and add global scope to filter by tenant (except SuperAdmin).
     */
    protected static function bootHasTenant(): void
    {
        // Auto-assign tenant_id on creating
        static::creating(function ($model) {
            if (auth()->check() && auth()->user()->tenant_id && empty($model->tenant_id)) {
                $model->tenant_id = auth()->user()->tenant_id;
            }
        });

        // Global scope: filter by tenant unless super_admin
        static::addGlobalScope('tenant', function (Builder $query) {
            if (auth()->check() && ! auth()->user()->isSuperAdmin()) {
                $tenantId = auth()->user()->tenant_id;
                if ($tenantId) {
                    $query->where(
                        (new static)->getTable() . '.tenant_id',
                        $tenantId
                    );
                }
            }
        });
    }

    /**
     * Bypass tenant scope — used for public queries.
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }
}

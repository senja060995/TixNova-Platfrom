<?php

namespace App\Console\Commands;

use App\Services\WarehouseService;
use Illuminate\Console\Command;

class BuildAnalytics extends Command
{
    protected $signature = 'analytics:build
        {--days=0 : Rebuild only the last N days. 0 (default) rebuilds everything}';

    protected $description = 'Build/refresh the data warehouse fact tables (order daily + event daily snapshots)';

    public function handle(WarehouseService $warehouse): int
    {
        $days = (int) $this->option('days');

        $result = $days > 0
            ? $warehouse->rebuildSince($days)
            : $warehouse->rebuildAll();

        $this->info("Warehouse rebuilt: {$result['orders']} order-day row(s), {$result['snapshots']} event-day snapshot(s).");

        return self::SUCCESS;
    }
}

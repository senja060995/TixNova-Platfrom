<?php

use App\Console\Commands\BuildAnalytics;
use App\Console\Commands\ExpirePendingOrders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(ExpirePendingOrders::class)->everyMinute()->withoutOverlapping();
Schedule::command(BuildAnalytics::class, ['--days' => 30])->dailyAt('01:00')->withoutOverlapping();

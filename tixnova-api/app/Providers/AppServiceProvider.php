<?php

namespace App\Providers;

use App\Models\Order;
use App\Observers\OrderObserver;
use App\Services\Payments\XenditGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(XenditGateway::class, function () {
            return new XenditGateway(
                (string) config('services.xendit.secret_key', ''),
                (string) config('services.xendit.base_url', 'https://api.xendit.co'),
                (string) config('services.midtrans.frontend_url', 'http://localhost:3000')
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Order::observe(OrderObserver::class);
    }
}

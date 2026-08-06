<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\Payment;
use App\Services\InventoryReservationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpirePendingOrders extends Command
{
    protected $signature = 'orders:expire';

    protected $description = 'Expire unpaid orders and release their ticket reservations';

    public function handle(InventoryReservationService $inventory): int
    {
        $expired = 0;

        Order::withoutGlobalScopes()
            ->where('status', 'pending')
            ->where('expired_at', '<=', now())
            ->select('id')
            ->orderBy('id')
            ->chunkById(100, function ($orders) use ($inventory, &$expired) {
                foreach ($orders as $order) {
                    $didExpire = DB::transaction(function () use ($order, $inventory) {
                        $order = Order::withoutGlobalScopes()
                            ->whereKey($order->id)
                            ->lockForUpdate()
                            ->first();

                        if (! $order || $order->status !== 'pending' || ! $order->expired_at || $order->expired_at->isFuture()) {
                            return false;
                        }

                        $order->load('items');
                        $inventory->release($order);
                        $order->update(['status' => 'expired']);
                        Payment::where('order_id', $order->id)
                            ->where('status', 'pending')
                            ->lockForUpdate()
                            ->update(['status' => 'expired']);

                        return true;
                    });

                    if ($didExpire) {
                        $expired++;
                    }
                }
            });

        $this->info("Expired {$expired} order(s).");

        return self::SUCCESS;
    }
}

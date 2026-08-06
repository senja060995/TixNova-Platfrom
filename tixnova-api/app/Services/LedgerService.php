<?php

namespace App\Services;

use App\Models\LedgerEntry;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class LedgerService
{
    public function recordSale(Order $order): void
    {
        DB::transaction(function () use ($order) {
            if (LedgerEntry::where('order_id', $order->id)->where('type', 'sale')->exists()) {
                return;
            }

            LedgerEntry::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'type' => 'sale',
                'amount' => $order->total,
                'status' => 'settled',
                'reference' => $order->order_code,
                'meta' => ['subtotal' => $order->subtotal, 'admin_fee' => $order->admin_fee],
            ]);

            LedgerEntry::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'type' => 'fee',
                'amount' => -(float) $order->commission_fee,
                'status' => 'settled',
                'reference' => $order->order_code,
                'meta' => ['note' => 'platform commission'],
            ]);
        });
    }

    public function recordRefund(Order $order): void
    {
        DB::transaction(function () use ($order) {
            if (LedgerEntry::where('order_id', $order->id)->where('type', 'refund')->exists()) {
                return;
            }

            $amount = $order->refund?->amount ?? max(0, (float) $order->subtotal - (float) $order->discount);

            LedgerEntry::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'type' => 'refund',
                'amount' => -(float) $amount,
                'status' => 'settled',
                'reference' => $order->order_code,
                'meta' => ['reason' => $order->refund?->reason],
            ]);
        });
    }

    public function balance(int $tenantId): array
    {
        $gross = (float) LedgerEntry::where('tenant_id', $tenantId)
            ->where('type', 'sale')->sum('amount');
        $fees = (float) LedgerEntry::where('tenant_id', $tenantId)
            ->where('type', 'fee')->sum('amount');
        $refunds = (float) LedgerEntry::where('tenant_id', $tenantId)
            ->where('type', 'refund')->sum('amount');

        return [
            'gross' => $gross,
            'platform_fees' => $fees,
            'refunds' => $refunds,
            'net_balance' => $gross + $fees + $refunds,
        ];
    }
}

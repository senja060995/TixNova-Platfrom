<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Order;
use App\Models\Tenant;

class TrustScoreService
{
    public function refreshScore(Tenant $tenant): Tenant
    {
        $paid = (int) Order::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'paid')
            ->count();

        $refunded = (int) Order::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('status', 'refunded')
            ->count();

        $pastEvents = Event::withoutGlobalScopes()
            ->where('tenant_id', $tenant->id)
            ->where('end_date', '<', now())
            ->get(['status']);

        $pastTotal = $pastEvents->count();
        $pastCancelled = $pastEvents->where('status', 'cancelled')->count();

        $completion = $pastTotal > 0
            ? ($pastTotal - $pastCancelled) / $pastTotal
            : 1.0;

        $orderCount = $paid + $refunded;
        $refundRate = $orderCount > 0
            ? $refunded / $orderCount
            : 0.0;

        $score = (0.6 * $completion + 0.4 * (1 - $refundRate)) * 100;
        $score = round(max(0, min(100, $score)), 2);

        $badge = match (true) {
            $score >= 85 => 'verified',
            $score >= 70 => 'gold',
            $score >= 50 => 'silver',
            $score >= 25 => 'bronze',
            default => 'none',
        };

        $tenant->update([
            'trust_score' => $score,
            'badge' => $badge,
        ]);

        return $tenant->fresh();
    }
}

<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrustController extends Controller
{
    public function __construct(private LedgerService $ledger) {}

    public function index(Request $request): JsonResponse
    {
        $tenants = Tenant::query()
            ->withCount(['orders as paid_count' => fn ($q) => $q->where('status', 'paid')])
            ->withCount(['orders as refunded_count' => fn ($q) => $q->where('status', 'refunded')])
            ->withCount('ledgerEntries')
            ->orderByDesc('trust_score')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tenants->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'status' => $tenant->status,
                'trust_score' => (float) $tenant->trust_score,
                'badge' => $tenant->badge,
                'paid_orders' => $tenant->paid_count,
                'refunded_orders' => $tenant->refunded_count,
                'ledger_entries' => $tenant->ledger_entries_count,
                'balance' => $this->ledger->balance($tenant->id),
            ]),
        ]);
    }
}

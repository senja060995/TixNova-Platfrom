<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenants = Tenant::withCount(['events', 'orders'])
            ->withSum(['orders' => fn ($q) => $q->where('status', 'paid')], 'total')
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json(['success' => true, 'data' => $tenants]);
    }

    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $tenant->load(['users', 'events']),
        ]);
    }

    public function activate(Tenant $tenant): JsonResponse
    {
        $tenant->update([
            'status' => 'active',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return response()->json(['success' => true, 'message' => 'Tenant berhasil diaktifkan.']);
    }

    public function suspend(Request $request, Tenant $tenant): JsonResponse
    {
        $request->validate(['reason' => ['nullable', 'string']]);

        $tenant->update(['status' => 'suspended']);

        return response()->json(['success' => true, 'message' => 'Tenant berhasil disuspend.']);
    }

    public function updateCommission(Request $request, Tenant $tenant): JsonResponse
    {
        $request->validate([
            'commission' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $tenant->update(['commission' => $request->commission]);

        return response()->json([
            'success' => true,
            'message' => 'Komisi tenant berhasil diperbarui.',
            'data' => ['commission' => $tenant->commission],
        ]);
    }
}

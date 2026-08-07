<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Services\WithdrawalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WithdrawalController extends Controller
{
    public function __construct(private WithdrawalService $withdrawals) {}

    public function index(Request $request): JsonResponse
    {
        $query = Withdrawal::with(['tenant:id,name,slug', 'requester:id,name', 'reviewer:id,name', 'processor:id,name']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $withdrawals = $query->orderByRaw("CASE status
                WHEN 'pending' THEN 0
                WHEN 'approved' THEN 1
                ELSE 2
            END")
            ->orderByDesc('requested_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    public function approve(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $withdrawal = $this->withdrawals->approve($withdrawal, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Penarikan dana disetujui. Saldo promotor akan dicairkan setelah transfer dikonfirmasi.',
            'data' => $withdrawal,
        ]);
    }

    public function reject(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $withdrawal = $this->withdrawals->reject($withdrawal, $request->user(), $data['note'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan penarikan dana ditolak.',
            'data' => $withdrawal,
        ]);
    }

    public function complete(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $withdrawal = $this->withdrawals->complete($withdrawal, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Penarikan dana ditandai selesai dan dana telah ditransfer ke rekening promotor.',
            'data' => $withdrawal,
        ]);
    }

    public function fail(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $withdrawal = $this->withdrawals->fail($withdrawal, $request->user(), $data['note'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Penarikan dana gagal. Dana dikembalikan ke saldo promotor.',
            'data' => $withdrawal,
        ]);
    }
}

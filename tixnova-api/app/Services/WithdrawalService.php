<?php

namespace App\Services;

use App\Models\User;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WithdrawalService
{
    public function __construct(private LedgerService $ledger) {}

    public function balance(int $tenantId): array
    {
        $net = $this->ledger->balance($tenantId)['net_balance'];

        $pending = (float) Withdrawal::where('tenant_id', $tenantId)
            ->whereIn('status', ['pending', 'approved', 'processing'])
            ->sum('amount');
        $withdrawn = (float) Withdrawal::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->sum('amount');

        $available = max(0, $net - $pending - $withdrawn);

        return [
            'net_balance' => round($net, 2),
            'available_balance' => round($available, 2),
            'reserved' => round($pending, 2),
            'withdrawn' => round($withdrawn, 2),
        ];
    }

    public function request(User $user, array $data): Withdrawal
    {
        $amount = (int) round((float) $data['amount']);
        $balance = $this->balance($user->tenant_id);

        if ($amount < 10000) {
            throw ValidationException::withMessages([
                'amount' => 'Jumlah penarikan minimal Rp10.000.',
            ]);
        }

        if ($amount > $balance['available_balance']) {
            throw ValidationException::withMessages([
                'amount' => 'Saldo tidak mencukupi untuk penarikan sebesar itu.',
            ]);
        }

        return DB::transaction(function () use ($user, $amount, $data) {
            $withdrawal = Withdrawal::create([
                'tenant_id' => $user->tenant_id,
                'requested_by' => $user->id,
                'code' => $this->generateCode(),
                'amount' => $amount,
                'status' => 'pending',
                'bank_name' => $data['bank_name'],
                'bank_account_name' => $data['bank_account_name'],
                'bank_account_number' => $data['bank_account_number'],
                'note' => $data['note'] ?? null,
                'requested_at' => now(),
            ]);

            return $withdrawal->fresh();
        });
    }

    public function cancel(Withdrawal $withdrawal, User $user): Withdrawal
    {
        if ($withdrawal->tenant_id !== $user->tenant_id) {
            abort(404);
        }

        if ($withdrawal->status !== 'pending') {
            throw ValidationException::withMessages([
                'status' => 'Hanya penarikan berstatus pending yang dapat dibatalkan.',
            ]);
        }

        $withdrawal->update(['status' => 'cancelled']);

        return $withdrawal->fresh();
    }

    public function approve(Withdrawal $withdrawal, User $admin): Withdrawal
    {
        return DB::transaction(function () use ($withdrawal, $admin) {
            $withdrawal = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($withdrawal->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => 'Penarikan ini tidak lagi berstatus pending.',
                ]);
            }

            $withdrawal->update([
                'status' => 'approved',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            return $withdrawal->fresh();
        });
    }

    public function reject(Withdrawal $withdrawal, User $admin, ?string $note = null): Withdrawal
    {
        return DB::transaction(function () use ($withdrawal, $admin, $note) {
            $withdrawal = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($withdrawal->status !== 'pending') {
                throw ValidationException::withMessages([
                    'status' => 'Penarikan ini tidak lagi berstatus pending.',
                ]);
            }

            $withdrawal->update([
                'status' => 'rejected',
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'review_note' => $note,
            ]);

            return $withdrawal->fresh();
        });
    }

    public function complete(Withdrawal $withdrawal, User $admin): Withdrawal
    {
        return DB::transaction(function () use ($withdrawal, $admin) {
            $withdrawal = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($withdrawal->status !== 'approved') {
                throw ValidationException::withMessages([
                    'status' => 'Penarikan harus disetujui terlebih dahulu.',
                ]);
            }

            $withdrawal->update([
                'status' => 'completed',
                'processed_by' => $admin->id,
                'processed_at' => now(),
                'completed_at' => now(),
            ]);

            return $withdrawal->fresh();
        });
    }

    public function fail(Withdrawal $withdrawal, User $admin, ?string $note = null): Withdrawal
    {
        return DB::transaction(function () use ($withdrawal, $admin, $note) {
            $withdrawal = Withdrawal::whereKey($withdrawal->id)->lockForUpdate()->firstOrFail();

            if ($withdrawal->status !== 'approved') {
                throw ValidationException::withMessages([
                    'status' => 'Penarikan harus disetujui terlebih dahulu.',
                ]);
            }

            $withdrawal->update([
                'status' => 'failed',
                'processed_by' => $admin->id,
                'processed_at' => now(),
                'review_note' => $note,
            ]);

            return $withdrawal->fresh();
        });
    }

    private function generateCode(): string
    {
        do {
            $code = 'WDL-'.strtoupper(str()->random(10));
        } while (Withdrawal::where('code', $code)->exists());

        return $code;
    }
}

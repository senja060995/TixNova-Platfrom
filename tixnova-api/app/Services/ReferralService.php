<?php

namespace App\Services;

use App\Models\DistributionLink;
use App\Models\Order;
use App\Models\ReferralCode;
use App\Models\ReferralReward;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReferralService
{
    public function attach(?string $code, User $buyer): ?ReferralCode
    {
        if (blank($code)) {
            return null;
        }

        $code = strtoupper(trim($code));
        $referralCode = ReferralCode::where('code', $code)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        if (! $referralCode) {
            $referrer = User::where('referral_code', $code)->first();

            if ($referrer) {
                $referralCode = $this->codeFor($referrer);
            }
        }

        if (! $referralCode || ! $referralCode->is_active || $referralCode->user_id === $buyer->id) {
            throw ValidationException::withMessages([
                'referral_code' => 'Kode referral tidak valid.',
            ]);
        }

        return $referralCode;
    }

    public function rewardPaidOrder(Order $order): void
    {
        if (blank($order->referral_code)) {
            return;
        }

        DB::transaction(function () use ($order) {
            if (ReferralReward::where('order_id', $order->id)->exists()) {
                return;
            }

            $code = ReferralCode::where('code', $order->referral_code)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $code || $code->user_id === $order->user_id) {
                return;
            }

            $amount = round((float) $order->subtotal * ((float) $code->commission_rate / 100), 2);

            ReferralReward::create([
                'referral_code_id' => $code->id,
                'order_id' => $order->id,
                'referrer_id' => $code->user_id,
                'commission_rate' => $code->commission_rate,
                'amount' => $amount,
                'earned_at' => now(),
            ]);

            $code->increment('total_used');
            $code->increment('total_earned', $amount);
        });
    }

    public function reverseReward(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $reward = ReferralReward::where('order_id', $order->id)
                ->whereNull('reversed_at')
                ->lockForUpdate()
                ->first();

            if (! $reward) {
                return;
            }

            $code = ReferralCode::whereKey($reward->referral_code_id)->lockForUpdate()->first();

            $reward->update([
                'reversed_at' => now(),
                'reversal_reason' => 'refund_confirmed',
            ]);

            if ($code) {
                $code->total_used = max(0, $code->total_used - 1);
                $code->total_earned = max(0, (float) $code->total_earned - (float) $reward->amount);
                $code->save();
            }
        });
    }

    public function activateAffiliate(User $user): ReferralCode
    {
        $code = $this->codeFor($user);

        if (! $code->is_affiliate) {
            $code->update(['is_affiliate' => true]);
        }

        return $code->fresh();
    }

    public function createDistributionLink(User $user, string $label, ?string $source): DistributionLink
    {
        $code = $this->codeFor($user);

        return DistributionLink::create([
            'user_id' => $user->id,
            'referral_code_id' => $code->id,
            'label' => $label,
            'code' => $this->generateLinkCode(),
            'source' => $source,
        ]);
    }

    public function distributionLinks(User $user)
    {
        return DistributionLink::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function deactivateDistributionLink(User $user, int $linkId): bool
    {
        $link = DistributionLink::where('id', $linkId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        return $link->update(['is_active' => false]);
    }

    public function trackLinkClick(string $linkCode): ?DistributionLink
    {
        $link = DistributionLink::where('code', strtoupper(trim($linkCode)))
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        if (! $link) {
            return null;
        }

        $link->increment('clicks');

        return $link->fresh();
    }

    public function payout(User $user): array
    {
        $code = $this->codeFor($user);

        return DB::transaction(function () use ($code) {
            $pending = $code->rewards()
                ->whereNull('reversed_at')
                ->where('status', 'pending')
                ->lockForUpdate()
                ->get();

            if ($pending->isEmpty()) {
                return ['paid' => 0, 'amount' => 0];
            }

            $amount = (float) $pending->sum('amount');
            $pending->each->update(['status' => 'paid', 'paid_at' => now()]);

            return ['paid' => $pending->count(), 'amount' => $amount];
        });
    }

    public function dashboard(User $user): array
    {
        $code = $this->codeFor($user)->fresh();

        $rewards = $code->rewards()->latest('earned_at');
        $pendingAmount = (float) $rewards
            ->clone()
            ->whereNull('reversed_at')
            ->where('status', 'pending')
            ->sum('amount');
        $paidAmount = (float) $rewards
            ->clone()
            ->whereNull('reversed_at')
            ->where('status', 'paid')
            ->sum('amount');

        return [
            'code' => $code->code,
            'commission_rate' => (float) $code->commission_rate,
            'is_affiliate' => $code->is_affiliate,
            'total_used' => $code->total_used,
            'total_earned' => (float) $code->total_earned,
            'pending_amount' => $pendingAmount,
            'paid_amount' => $paidAmount,
            'recent_rewards' => $rewards
                ->with('order.event:id,title')
                ->limit(10)
                ->get()
                ->map(fn (ReferralReward $reward) => [
                    'order_code' => $reward->order->order_code,
                    'event_title' => $reward->order->event?->title,
                    'amount' => (float) $reward->amount,
                    'status' => $reward->status,
                    'earned_at' => $reward->earned_at?->toIso8601String(),
                ]),
        ];
    }

    private function codeFor(User $user): ReferralCode
    {
        return ReferralCode::firstOrCreate(
            ['user_id' => $user->id],
            [
                'code' => $user->referral_code ?: $this->generateCode(),
                'commission_rate' => 2,
            ]
        );
    }

    private function generateCode(): string
    {
        do {
            $code = 'REF-'.strtoupper(str()->random(8));
        } while (ReferralCode::where('code', $code)->exists());

        return $code;
    }

    private function generateLinkCode(): string
    {
        do {
            $code = 'LNK-'.strtoupper(str()->random(8));
        } while (DistributionLink::where('code', $code)->exists());

        return $code;
    }
}

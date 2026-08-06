<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\DistributionLink;
use App\Models\ReferralCode;
use App\Models\ReferralReward;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ReferralCode::with('user:id,name,email')
            ->where('is_affiliate', true)
            ->withCount('distributionLinks');

        if ($request->has('search')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->string('search').'%')
                    ->orWhere('email', 'like', '%'.$request->string('search').'%');
            });
        }

        $affiliates = $query->orderByDesc('total_earned')->get();

        return response()->json([
            'success' => true,
            'data' => $affiliates->map(fn (ReferralCode $code) => [
                'id' => $code->id,
                'user_id' => $code->user_id,
                'name' => $code->user?->name,
                'email' => $code->user?->email,
                'code' => $code->code,
                'commission_rate' => (float) $code->commission_rate,
                'total_used' => $code->total_used,
                'total_earned' => (float) $code->total_earned,
                'pending_amount' => (float) $code->rewards()
                    ->whereNull('reversed_at')
                    ->where('status', 'pending')
                    ->sum('amount'),
                'paid_amount' => (float) $code->rewards()
                    ->whereNull('reversed_at')
                    ->where('status', 'paid')
                    ->sum('amount'),
                'links_count' => $code->distribution_links_count,
            ]),
        ]);
    }

    public function rewards(Request $request): JsonResponse
    {
        $query = ReferralReward::with(['referrer:id,name,email', 'order.event:id,title'])
            ->latest('earned_at');

        if ($request->has('status')) {
            $query->where('status', $request->string('status'));
        }

        $rewards = $query->paginate($request->integer('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $rewards->through(fn (ReferralReward $reward) => [
                'id' => $reward->id,
                'referrer_name' => $reward->referrer?->name,
                'referrer_email' => $reward->referrer?->email,
                'order_code' => $reward->order?->order_code,
                'event_title' => $reward->order?->event?->title,
                'amount' => (float) $reward->amount,
                'status' => $reward->status,
                'earned_at' => $reward->earned_at?->toIso8601String(),
                'paid_at' => $reward->paid_at?->toIso8601String(),
            ]),
        ]);
    }

    public function links(): JsonResponse
    {
        $links = DistributionLink::with('user:id,name,email')
            ->orderByDesc('clicks')
            ->limit(100)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $links->map(fn (DistributionLink $link) => [
                'id' => $link->id,
                'owner' => $link->user?->name,
                'label' => $link->label,
                'code' => $link->code,
                'source' => $link->source,
                'is_active' => $link->is_active,
                'clicks' => $link->clicks,
                'created_at' => $link->created_at?->toIso8601String(),
            ]),
        ]);
    }
}

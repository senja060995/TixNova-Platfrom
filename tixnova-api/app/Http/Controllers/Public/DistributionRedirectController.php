<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DistributionRedirectController extends Controller
{
    public function __construct(private ReferralService $referrals) {}

    public function redirect(Request $request, string $code): JsonResponse|RedirectResponse
    {
        $link = $this->referrals->trackLinkClick($code);

        if (! $link) {
            abort(404, 'Link distribusi tidak ditemukan.');
        }

        $url = rtrim(config('services.app.frontend_url'), '/').'/?'.http_build_query([
            'ref' => $link->referralCode->code,
            'src' => $link->source,
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'redirect_to' => $url,
                    'code' => $link->code,
                    'clicks' => $link->clicks,
                ],
            ]);
        }

        return redirect()->away($url);
    }
}

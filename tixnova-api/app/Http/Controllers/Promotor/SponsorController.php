<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Sponsor;
use App\Models\Sponsorship;
use App\Services\PoAService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SponsorController extends Controller
{
    public function __construct(private PoAService $poa) {}

    public function index(Request $request): JsonResponse
    {
        $sponsors = Sponsor::query()
            ->withCount('sponsorships')
            ->withSum('sponsorships as total_sponsorship_amount', 'amount')
            ->orderBy('name')
            ->get();

        $summary = [
            'total_sponsors' => $sponsors->count(),
            'total_sponsorships' => (int) $sponsors->sum('sponsorships_count'),
            'total_amount' => number_format((float) $sponsors->sum('total_sponsorship_amount'), 2, '.', ''),
            'active_sponsorships' => (int) Sponsor::query()
                ->whereRelation('sponsorships', 'status', Sponsorship::STATUS_ACTIVE)
                ->count(),
            'released_sponsorships' => (int) Sponsor::query()
                ->whereRelation('sponsorships', 'status', Sponsorship::STATUS_RELEASED)
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'sponsors' => $sponsors,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'website' => ['nullable', 'string', 'url', 'max:255'],
            'industry' => ['nullable', 'string', 'max:100'],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $sponsor = Sponsor::create([
            ...$data,
            'slug' => Str::slug($data['name']).'-'.Str::random(5),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sponsor berhasil ditambahkan.',
            'data' => $sponsor,
        ], 201);
    }

    public function update(Request $request, Sponsor $sponsor): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'website' => ['nullable', 'string', 'url', 'max:255'],
            'industry' => ['nullable', 'string', 'max:100'],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $sponsor->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sponsor berhasil diperbarui.',
            'data' => $sponsor,
        ]);
    }

    public function destroy(Sponsor $sponsor): JsonResponse
    {
        if ($sponsor->sponsorships()->where('status', '!=', Sponsorship::STATUS_PENDING)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Sponsor tidak dapat dihapus karena masih memiliki sponsorship aktif.',
            ], 422);
        }

        $sponsor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sponsor berhasil dihapus.',
        ]);
    }

    public function byEvent(Event $event): JsonResponse
    {
        $sponsorships = $event->sponsorships()
            ->with('sponsor')
            ->orderBy('amount', 'desc')
            ->get();

        $report = $this->poa->report($event);

        return response()->json([
            'success' => true,
            'data' => [
                'event' => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'slug' => $event->slug,
                ],
                'sponsorships' => $sponsorships,
                'poa' => $report['summary'],
            ],
        ]);
    }

    public function attach(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'sponsor_id' => ['required', 'exists:sponsors,id'],
            'package_name' => ['nullable', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'poa_threshold_pct' => ['required', 'integer', 'between:0,100'],
            'terms' => ['nullable', 'string', 'max:1000'],
        ]);

        $exists = $event->sponsorships()->where('sponsor_id', $data['sponsor_id'])->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Sponsor sudah terdaftar untuk event ini.',
            ], 422);
        }

        $sponsorship = $event->sponsorships()->create([
            ...$data,
            'status' => Sponsorship::STATUS_ACTIVE,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sponsorship berhasil dibuat.',
            'data' => $sponsorship->load('sponsor'),
        ], 201);
    }

    public function updateSponsorship(Request $request, Sponsorship $sponsorship): JsonResponse
    {
        $data = $request->validate([
            'package_name' => ['nullable', 'string', 'max:150'],
            'amount' => ['sometimes', 'numeric', 'min:0', 'max:9999999999'],
            'poa_threshold_pct' => ['sometimes', 'integer', 'between:0,100'],
            'terms' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($sponsorship->status === Sponsorship::STATUS_RELEASED) {
            return response()->json([
                'success' => false,
                'message' => 'Sponsorship yang sudah dilepas tidak dapat diubah.',
            ], 422);
        }

        $sponsorship->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Sponsorship berhasil diperbarui.',
            'data' => $sponsorship->load('sponsor'),
        ]);
    }

    public function destroySponsorship(Sponsorship $sponsorship): JsonResponse
    {
        if ($sponsorship->status === Sponsorship::STATUS_RELEASED) {
            return response()->json([
                'success' => false,
                'message' => 'Sponsorship yang sudah dilepas tidak dapat dihapus.',
            ], 422);
        }

        $sponsorship->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sponsorship berhasil dihapus.',
        ]);
    }

    public function poa(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->poa->report($event),
        ]);
    }

    public function release(Sponsorship $sponsorship): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Pelepasan escrow diproses.',
            'data' => $this->poa->release($sponsorship),
        ]);
    }
}

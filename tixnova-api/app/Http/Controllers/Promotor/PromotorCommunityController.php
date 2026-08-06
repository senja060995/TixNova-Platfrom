<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\CommunityEvent;
use App\Models\CommunityMember;
use App\Models\Event;
use App\Services\CommunityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotorCommunityController extends Controller
{
    public function __construct(private CommunityService $community) {}

    public function index(Request $request): JsonResponse
    {
        $communities = Community::where('tenant_id', $request->user()->tenant_id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $communities,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'in:fan_club,komunitas,campus,corporate'],
            'description' => ['nullable', 'string'],
        ]);

        $community = Community::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $data['name'],
            'type' => $data['type'] ?? 'komunitas',
            'description' => $data['description'] ?? null,
            'slug' => str($data['name'])->slug().'-'.str()->lower(str()->random(6)),
            'code' => strtoupper(str()->random(6)),
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Komunitas dibuat.',
            'data' => $community,
        ], 201);
    }

    public function show(Request $request, Community $community): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $community->load(['events.event:id,title,slug,start_date,city', 'members']),
        ]);
    }

    public function update(Request $request, Community $community): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:fan_club,komunitas,campus,corporate'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:active,inactive'],
        ]);

        $community->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Komunitas diperbarui.',
            'data' => $community->fresh(),
        ]);
    }

    public function destroy(Community $community): JsonResponse
    {
        $community->delete();

        return response()->json([
            'success' => true,
            'message' => 'Komunitas dihapus.',
        ]);
    }

    public function members(Request $request, Community $community): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $community->members()->orderByDesc('joined_at')->paginate($request->integer('per_page', 50)),
        ]);
    }

    public function updateMemberRole(Request $request, Community $community, CommunityMember $member): JsonResponse
    {
        if ($member->community_id !== $community->id) {
            abort(404);
        }

        $data = $request->validate([
            'role' => ['required', 'in:member,leader'],
        ]);

        $member->update(['role' => $data['role']]);

        return response()->json([
            'success' => true,
            'message' => 'Peran anggota diperbarui.',
            'data' => $member->fresh(),
        ]);
    }

    public function removeMember(Request $request, Community $community, CommunityMember $member): JsonResponse
    {
        if ($member->community_id !== $community->id) {
            abort(404);
        }

        $member->delete();

        return response()->json([
            'success' => true,
            'message' => 'Anggota dikeluarkan.',
        ]);
    }

    public function communityEvents(Request $request, Community $community): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $community->events()->with('event:id,title,slug,start_date,city')->paginate($request->integer('per_page', 20)),
        ]);
    }

    public function attachEvent(Request $request, Community $community): JsonResponse
    {
        $data = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'revenue_share_pct' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $event = Event::withoutGlobalScopes()->findOrFail($data['event_id']);

        if ($event->tenant_id !== $community->tenant_id) {
            abort(422, 'Event bukan milik tenant ini.');
        }

        $ce = $this->community->attachEvent($community, $event->id, $data['revenue_share_pct']);

        return response()->json([
            'success' => true,
            'message' => 'Event ditambahkan ke komunitas.',
            'data' => $ce->load('event:id,title,slug,start_date,city'),
        ], 201);
    }

    public function updateEventShare(Request $request, Community $community, CommunityEvent $communityEvent): JsonResponse
    {
        if ($communityEvent->community_id !== $community->id) {
            abort(404);
        }

        $data = $request->validate([
            'revenue_share_pct' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $ce = $this->community->updateEventShare($communityEvent, $data['revenue_share_pct']);

        return response()->json([
            'success' => true,
            'message' => 'Persentase share diperbarui.',
            'data' => $ce,
        ]);
    }

    public function detachEvent(Community $community, CommunityEvent $communityEvent): JsonResponse
    {
        if ($communityEvent->community_id !== $community->id) {
            abort(404);
        }

        $this->community->detachEvent($communityEvent);

        return response()->json([
            'success' => true,
            'message' => 'Event dikeluarkan dari komunitas.',
        ]);
    }

    public function payouts(Request $request, Community $community): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $community->payouts()->orderByDesc('earned_at')->paginate($request->integer('per_page', 20)),
        ]);
    }

    public function summary(Request $request, Community $community): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->community->summary($community),
        ]);
    }
}

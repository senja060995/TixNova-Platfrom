<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Community;
use App\Models\CommunityMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCommunityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $communities = Community::withoutGlobalScopes()
            ->where('status', 'active')
            ->withCount('members')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $communities,
        ]);
    }

    public function show(Community $community): JsonResponse
    {
        $community->load(['events.event:id,title,slug,start_date,city', 'members' => fn ($q) => $q->where('role', 'leader')]);

        return response()->json([
            'success' => true,
            'data' => $community,
        ]);
    }

    public function join(Community $community, Request $request): JsonResponse
    {
        $user = $request->user();

        $member = CommunityMember::where('community_id', $community->id)
            ->where('user_id', $user->id)
            ->first();

        if ($member) {
            return response()->json([
                'success' => true,
                'message' => 'Anda sudah menjadi anggota komunitas ini.',
                'data' => $member,
            ]);
        }

        $member = CommunityMember::create([
            'community_id' => $community->id,
            'user_id' => $user->id,
            'role' => 'member',
            'joined_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil bergabung dengan komunitas.',
            'data' => $member,
        ], 201);
    }

    public function leave(Community $community, Request $request): JsonResponse
    {
        $user = $request->user();

        $deleted = CommunityMember::where('community_id', $community->id)
            ->where('user_id', $user->id)
            ->delete();

        if (! $deleted) {
            return response()->json([
                'success' => true,
                'message' => 'Anda bukan anggota komunitas ini.',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil keluar dari komunitas.',
        ]);
    }
}

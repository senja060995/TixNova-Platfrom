<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Jobs\SendCrmCampaign;
use App\Models\CrmCampaign;
use App\Models\Event;
use App\Services\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CrmController extends Controller
{
    public function __construct(private CrmService $crm) {}

    public function segments(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        return response()->json([
            'success' => true,
            'data' => [
                'segments' => $this->crm->segmentCounts($tenantId),
                'labels' => [
                    'new' => 'Belum pernah membeli',
                    'first_timer' => 'Pertama kali',
                    'repeat' => 'Beli berulang',
                    'vip' => 'VIP',
                    'churned' => 'Tidak aktif >90 hari',
                ],
            ],
        ]);
    }

    public function segmentMembers(Request $request, string $segment): JsonResponse
    {
        if (! in_array($segment, CrmService::SEGMENT_ORDER, true)) {
            abort(422, 'Segmen tidak dikenal.');
        }

        $members = $this->crm->segmentMembers(
            $request->user()->tenant_id,
            $segment,
            $request->integer('limit', 50),
        );

        return response()->json([
            'success' => true,
            'data' => $members,
        ]);
    }

    public function similar(Event $event): JsonResponse
    {
        $events = $this->crm->similarEvents([
            'category_ids' => $event->category_id ? [$event->category_id] : [],
            'city' => $event->city,
        ], [$event->id]);

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    // ─── Re-marketing ─────────────────────────────────────────

    public function campaigns(Request $request): JsonResponse
    {
        $campaigns = CrmCampaign::with('event:id,title,slug,start_date,city')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $campaigns,
        ]);
    }

    public function campaignPreview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'segment' => ['required', 'string', 'in:'.implode(',', CrmService::SEGMENT_ORDER)],
        ]);

        $recipients = $this->crm->segmentBuyers($request->user()->tenant_id, $data['segment']);

        return response()->json([
            'success' => true,
            'data' => [
                'recipients_count' => count($recipients),
                'sample' => array_slice($recipients, 0, 10),
            ],
        ]);
    }

    public function campaignStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'segment' => ['required', 'string', 'in:'.implode(',', CrmService::SEGMENT_ORDER)],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'event_id' => ['nullable', 'integer'],
            'channel' => ['nullable', 'string', 'in:email'],
        ]);

        $campaign = DB::transaction(function () use ($request, $data) {
            $event = null;
            if (! empty($data['event_id'])) {
                $event = Event::query()->find($data['event_id']);
                abort_if(! $event, 422, 'Event tidak ditemukan.');
            }

            return CrmCampaign::create([
                'tenant_id' => $request->user()->tenant_id,
                'name' => $data['name'],
                'segment' => $data['segment'],
                'channel' => $data['channel'] ?? 'email',
                'subject' => $data['subject'],
                'message' => $data['message'],
                'event_id' => $event?->id,
                'status' => 'draft',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Kampanye re-marketing dibuat.',
            'data' => $campaign->load('event:id,title,slug,start_date,city'),
        ], 201);
    }

    public function campaignShow(Request $request, CrmCampaign $campaign): JsonResponse
    {
        $recipients = $campaign->isDraft()
            ? $this->crm->segmentBuyers($request->user()->tenant_id, $campaign->segment)
            : [];

        return response()->json([
            'success' => true,
            'data' => [
                'campaign' => $campaign->load('event:id,title,slug,start_date,city'),
                'recipients_count' => $campaign->isDraft() ? count($recipients) : $campaign->recipients_count,
                'sample' => $campaign->isDraft() ? array_slice($recipients, 0, 10) : [],
            ],
        ]);
    }

    public function campaignSend(Request $request, CrmCampaign $campaign): JsonResponse
    {
        abort_if(! $campaign->isDraft(), 422, 'Kampanye sudah dikirim.');

        SendCrmCampaign::dispatch($campaign->id);

        return response()->json([
            'success' => true,
            'message' => 'Kampanye sedang dikirim ke segmen target.',
            'data' => $campaign->fresh(),
        ]);
    }

    public function campaignDestroy(CrmCampaign $campaign): JsonResponse
    {
        abort_if(! $campaign->isDraft(), 422, 'Hanya kampanye draft yang bisa dihapus.');

        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kampanye dihapus.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventBudgetItem;
use App\Models\EventChecklistItem;
use App\Models\EventTimelineItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ErpController extends Controller
{
    public function overview(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $budgetItems = $event->budgetItems;

        $planned = (float) $budgetItems->sum('planned_amount');
        $actual = (float) $budgetItems->sum('actual_amount');

        $checklists = $event->checklistItems;
        $timeline = $event->timelineItems;

        return response()->json([
            'success' => true,
            'data' => [
                'event' => ['id' => $event->id, 'title' => $event->title, 'slug' => $event->slug],
                'budget' => [
                    'planned_total' => $planned,
                    'actual_total' => $actual,
                    'variance' => $planned - $actual,
                    'over_budget' => $actual > $planned,
                    'by_category' => $budgetItems->groupBy('category')->map(fn ($items) => [
                        'count' => $items->count(),
                        'planned' => (float) $items->sum('planned_amount'),
                        'actual' => (float) $items->sum('actual_amount'),
                    ]),
                ],
                'timeline' => [
                    'total' => $timeline->count(),
                    'done' => $timeline->where('status', 'done')->count(),
                    'missed' => $timeline->where('status', 'missed')->count(),
                ],
                'checklist' => [
                    'total' => $checklists->count(),
                    'done' => $checklists->where('is_done', true)->count(),
                    'progress' => $checklists->count() > 0
                        ? round($checklists->where('is_done', true)->count() / $checklists->count() * 100)
                        : 0,
                ],
            ],
        ]);
    }

    // ─── Budget ────────────────────────────────────────────────

    public function budgetIndex(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        return response()->json([
            'success' => true,
            'data' => $event->budgetItems()->orderBy('category')->orderBy('id')->get(),
        ]);
    }

    public function budgetStore(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'category' => ['required', 'in:production,marketing,artist,venue,equipment,staffing,other'],
            'label' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'planned_amount' => ['nullable', 'numeric', 'min:0'],
            'actual_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $item = $event->budgetItems()->create([
            ...$validated,
            'tenant_id' => $event->tenant_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item anggaran ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function budgetUpdate(Request $request, Event $event, EventBudgetItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'category' => ['sometimes', 'in:production,marketing,artist,venue,equipment,staffing,other'],
            'label' => ['sometimes', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'planned_amount' => ['sometimes', 'numeric', 'min:0'],
            'actual_amount' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item anggaran diperbarui.',
            'data' => $item,
        ]);
    }

    public function budgetDestroy(Request $request, Event $event, EventBudgetItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Item anggaran dihapus.']);
    }

    // ─── Timeline ──────────────────────────────────────────────

    public function timelineIndex(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        return response()->json([
            'success' => true,
            'data' => $event->timelineItems()->orderBy('sort_order')->orderBy('due_at')->get(),
        ]);
    }

    public function timelineStore(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $item = $event->timelineItems()->create([
            ...$validated,
            'tenant_id' => $event->tenant_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Milestone ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function timelineUpdate(Request $request, Event $event, EventTimelineItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Milestone diperbarui.',
            'data' => $item,
        ]);
    }

    public function timelineToggle(Request $request, Event $event, EventTimelineItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $item->update($item->status === 'done'
            ? ['status' => 'pending', 'completed_at' => null]
            : ['status' => 'done', 'completed_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    public function timelineDestroy(Request $request, Event $event, EventTimelineItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Milestone dihapus.']);
    }

    // ─── Checklist ─────────────────────────────────────────────

    public function checklistIndex(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        return response()->json([
            'success' => true,
            'data' => $event->checklistItems()->orderBy('phase')->orderBy('sort_order')->get(),
        ]);
    }

    public function checklistStore(Request $request, Event $event): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'phase' => ['required', 'in:pre_event,event_day,post_event'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $item = $event->checklistItems()->create([
            ...$validated,
            'tenant_id' => $event->tenant_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item checklist ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function checklistToggle(Request $request, Event $event, EventChecklistItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);

        $item->update($item->is_done
            ? ['is_done' => false, 'completed_at' => null]
            : ['is_done' => true, 'completed_at' => now()]);

        return response()->json([
            'success' => true,
            'data' => $item,
        ]);
    }

    public function checklistDestroy(Request $request, Event $event, EventChecklistItem $item): JsonResponse
    {
        $this->authorizeEvent($request, $event);
        $item->delete();

        return response()->json(['success' => true, 'message' => 'Item checklist dihapus.']);
    }

    private function authorizeEvent(Request $request, Event $event): void
    {
        if ($event->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Unauthorized.');
        }
    }
}

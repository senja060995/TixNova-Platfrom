<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\CreateTicketRequest;
use App\Models\Event;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * List tickets for an event.
     */
    public function index(Event $event): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $event->tickets()->orderBy('sort_order')->get(),
        ]);
    }

    /**
     * Create ticket for an event.
     */
    public function store(CreateTicketRequest $request, Event $event): JsonResponse
    {
        $ticket = $event->tickets()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil ditambahkan.',
            'data'    => $ticket,
        ], 201);
    }

    /**
     * Update a ticket.
     */
    public function update(Request $request, Event $event, Ticket $ticket): JsonResponse
    {
        $this->checkOwnership($event, $ticket);

        $request->validate([
            'name'         => ['sometimes', 'string', 'max:255'],
            'type'         => ['sometimes', 'in:regular,vip,early_bird,free'],
            'description'  => ['nullable', 'string'],
            'price'        => ['sometimes', 'numeric', 'min:0'],
            'quota'        => ['sometimes', 'integer', 'min:1'],
            'min_purchase' => ['sometimes', 'integer', 'min:1'],
            'max_purchase' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'sale_start'   => ['nullable', 'date'],
            'sale_end'     => ['nullable', 'date', 'after:sale_start'],
            'includes'     => ['nullable', 'array'],
            'is_active'    => ['boolean'],
            'sort_order'   => ['integer'],
        ]);

        $ticket->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil diperbarui.',
            'data'    => $ticket,
        ]);
    }

    /**
     * Delete a ticket.
     */
    public function destroy(Event $event, Ticket $ticket): JsonResponse
    {
        $this->checkOwnership($event, $ticket);

        if ($ticket->sold > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tiket yang sudah terjual tidak dapat dihapus.',
            ], 422);
        }

        $ticket->delete();

        return response()->json(['success' => true, 'message' => 'Tiket berhasil dihapus.']);
    }

    private function checkOwnership(Event $event, Ticket $ticket): void
    {
        if ($ticket->event_id !== $event->id) {
            abort(404);
        }
        if ($event->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Unauthorized.');
        }
    }
}

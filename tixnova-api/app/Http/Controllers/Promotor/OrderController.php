<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:pending,paid,cancelled,expired,refunded'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $orders = Order::with(['event:id,title'])
            ->withCount('items')
            ->when($data['search'] ?? null, fn ($query, $search) => $query->where(function ($nested) use ($search, $operator) {
                $nested->where('order_code', $operator, "%{$search}%")
                    ->orWhere('buyer_name', $operator, "%{$search}%")
                    ->orWhere('buyer_email', $operator, "%{$search}%");
            }))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['event_id'] ?? null, fn ($query, $eventId) => $query->where('event_id', $eventId))
            ->when($data['date_from'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($data['date_to'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate($data['per_page'] ?? 15);

        return response()->json(['success' => true, 'data' => $orders]);
    }

    public function eventOrders(Request $request, Event $event): JsonResponse
    {
        return $this->index($request->merge(['event_id' => $event->id]));
    }
}

<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OperationsController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:draft,pending,approved,rejected,ongoing,completed,cancelled'],
            'tenant_id' => ['nullable', 'integer', 'exists:tenants,id'],
            'city' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'featured' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $events = Event::withoutGlobalScopes()
            ->with('tenant:id,name,slug')
            ->withCount(['tickets', 'orders'])
            ->when($data['search'] ?? null, fn ($query, $search) => $query->where(function ($nested) use ($search, $operator) {
                $nested->where('title', $operator, "%{$search}%")
                    ->orWhere('slug', $operator, "%{$search}%")
                    ->orWhereHas('tenant', fn ($tenant) => $tenant->where('name', $operator, "%{$search}%"));
            }))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['tenant_id'] ?? null, fn ($query, $tenantId) => $query->where('tenant_id', $tenantId))
            ->when($data['city'] ?? null, fn ($query, $city) => $query->where('city', $operator, "%{$city}%"))
            ->when($data['date_from'] ?? null, fn ($query, $date) => $query->whereDate('start_date', '>=', $date))
            ->when($data['date_to'] ?? null, fn ($query, $date) => $query->whereDate('start_date', '<=', $date))
            ->when(array_key_exists('featured', $data), fn ($query) => $query->where('is_featured', $data['featured']))
            ->latest()
            ->paginate($data['per_page'] ?? 15);

        return response()->json(['success' => true, 'data' => $events]);
    }

    public function orders(Request $request): JsonResponse
    {
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:pending,paid,cancelled,refunded,expired'],
            'payment_status' => ['nullable', 'in:pending,success,failed,expired,refunded'],
            'refund_status' => ['nullable', 'in:requested,approved,rejected,processing,manual_required,refunded,failed'],
            'tenant_id' => ['nullable', 'integer', 'exists:tenants,id'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';

        $orders = Order::withoutGlobalScopes()
            ->with([
                'tenant:id,name,slug',
                'event:id,title,slug,start_date',
                'payment:id,order_id,provider,method,status,amount,paid_at',
                'refund:id,order_id,status,amount',
            ])
            ->when($data['search'] ?? null, fn ($query, $search) => $query->where(function ($nested) use ($search, $operator) {
                $nested->where('order_code', $operator, "%{$search}%")
                    ->orWhere('buyer_name', $operator, "%{$search}%")
                    ->orWhere('buyer_email', $operator, "%{$search}%");
            }))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['payment_status'] ?? null, fn ($query, $status) => $query->whereHas('payment', fn ($payment) => $payment->where('status', $status)))
            ->when($data['refund_status'] ?? null, fn ($query, $status) => $query->whereHas('refund', fn ($refund) => $refund->where('status', $status)))
            ->when($data['tenant_id'] ?? null, fn ($query, $tenantId) => $query->where('tenant_id', $tenantId))
            ->when($data['event_id'] ?? null, fn ($query, $eventId) => $query->where('event_id', $eventId))
            ->when($data['date_from'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($data['date_to'] ?? null, fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate($data['per_page'] ?? 15);

        $orders->getCollection()->transform(fn (Order $order) => [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'buyer' => [
                'name' => $this->maskName($order->buyer_name),
                'email' => $this->maskEmail($order->buyer_email),
                'phone' => $this->maskPhone($order->buyer_phone),
            ],
            'total' => (float) $order->total,
            'status' => $order->status,
            'created_at' => $order->created_at?->toIso8601String(),
            'paid_at' => $order->paid_at?->toIso8601String(),
            'tenant' => $order->tenant ? ['id' => $order->tenant->id, 'name' => $order->tenant->name] : null,
            'event' => $order->event ? ['id' => $order->event->id, 'title' => $order->event->title, 'slug' => $order->event->slug] : null,
            'payment' => $order->payment ? [
                'provider' => $order->payment->provider,
                'method' => $order->payment->method,
                'status' => $order->payment->status,
                'paid_at' => $order->payment->paid_at?->toIso8601String(),
            ] : null,
            'refund' => $order->refund ? [
                'status' => $order->refund->status,
                'amount' => (float) $order->refund->amount,
            ] : null,
        ]);

        return response()->json(['success' => true, 'data' => $orders]);
    }

    private function maskName(?string $name): ?string
    {
        if (blank($name)) {
            return null;
        }

        $words = preg_split('/\s+/', trim($name));

        return collect($words)->map(fn ($word) => mb_substr($word, 0, 1).str_repeat('*', max(1, mb_strlen($word) - 1)))->implode(' ');
    }

    private function maskEmail(?string $email): ?string
    {
        if (blank($email) || ! str_contains($email, '@')) {
            return null;
        }

        [$local, $domain] = explode('@', $email, 2);

        return mb_substr($local, 0, 1).str_repeat('*', max(1, mb_strlen($local) - 1)).'@'.$domain;
    }

    private function maskPhone(?string $phone): ?string
    {
        if (blank($phone)) {
            return null;
        }

        return str_repeat('*', max(0, mb_strlen($phone) - 4)).mb_substr($phone, -4);
    }
}

<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    /**
     * GET /api/events — Browse events dengan filter & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Event::withoutGlobalScopes()
            ->with(['category:id,name,slug,icon,color', 'tickets:id,event_id,name,type,price,quota,sold,is_active'])
            ->where('status', 'approved')
            ->where('end_date', '>', now());

        // Filter kota
        if ($request->filled('city')) {
            $query->where('city', 'LIKE', '%' . $request->city . '%');
        }

        // Filter kategori
        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        // Filter tanggal
        if ($request->filled('date_from')) {
            $query->where('start_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('start_date', '<=', $request->date_to . ' 23:59:59');
        }

        // Filter harga (berdasarkan tiket termurah)
        if ($request->filled('price_min')) {
            $query->whereHas('tickets', fn($q) => $q->where('price', '>=', $request->price_min)->where('is_active', true));
        }
        if ($request->filled('price_max')) {
            $query->whereHas('tickets', fn($q) => $q->where('price', '<=', $request->price_max)->where('is_active', true));
        }

        // Search
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'LIKE', "%{$s}%")
                  ->orWhere('venue', 'LIKE', "%{$s}%")
                  ->orWhere('city', 'LIKE', "%{$s}%");
            });
        }

        // Filter free events
        if ($request->boolean('is_free')) {
            $query->where('is_free', true);
        }

        // Sort
        match ($request->input('sort', 'upcoming')) {
            'date_asc'    => $query->orderBy('start_date', 'asc'),
            'date_desc'   => $query->orderBy('start_date', 'desc'),
            'price_asc'   => $query->orderByRaw('(SELECT MIN(price) FROM tickets WHERE tickets.event_id = events.id AND tickets.is_active = 1)'),
            'price_desc'  => $query->orderByRaw('(SELECT MAX(price) FROM tickets WHERE tickets.event_id = events.id AND tickets.is_active = 1) DESC'),
            'popular'     => $query->orderBy('view_count', 'desc'),
            default       => $query->orderBy('start_date', 'asc'),
        };

        $perPage = min((int) $request->input('per_page', 12), 50);
        $events  = $query->paginate($perPage);

        // Increment view count lightly (batch, not per request)
        // done separately if needed

        return response()->json([
            'success' => true,
            'data'    => $events,
        ]);
    }

    /**
     * GET /api/events/featured — Featured events untuk landing page.
     */
    public function featured(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 8), 20);

        $events = Event::withoutGlobalScopes()
            ->with(['category:id,name,slug,icon,color', 'tickets:id,event_id,name,type,price,quota,sold,is_active'])
            ->where('status', 'approved')
            ->where('is_featured', true)
            ->where('end_date', '>', now())
            ->orderBy('start_date', 'asc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $events,
        ]);
    }

    /**
     * GET /api/events/cities — Daftar kota yang punya event aktif.
     */
    public function cities(): JsonResponse
    {
        $cities = Event::withoutGlobalScopes()
            ->where('status', 'approved')
            ->where('end_date', '>', now())
            ->selectRaw('city, COUNT(*) as event_count')
            ->groupBy('city')
            ->orderByDesc('event_count')
            ->limit(20)
            ->get()
            ->map(fn($row) => [
                'name'       => $row->city,
                'slug'       => \Illuminate\Support\Str::slug($row->city),
                'eventCount' => $row->event_count,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $cities,
        ]);
    }

    /**
     * GET /api/events/{slug} — Detail event.
     */
    public function show(string $slug): JsonResponse
    {
        $event = Event::withoutGlobalScopes()
            ->with([
                'category:id,name,slug,icon,color',
                'tickets:id,event_id,name,type,price,quota,sold,min_purchase,max_purchase,sale_start,sale_end,is_active,description,includes,sort_order',
                'tenant:id,name,slug,logo',
            ])
            ->where('slug', $slug)
            ->where('status', 'approved')
            ->firstOrFail();

        // Increment view count
        $event->increment('view_count');

        return response()->json([
            'success' => true,
            'data'    => $event,
        ]);
    }

    /**
     * GET /api/categories — Daftar kategori event.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::where('type', 'event')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'icon', 'color']);

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }
}

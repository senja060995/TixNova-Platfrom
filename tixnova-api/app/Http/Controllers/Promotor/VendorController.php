<?php

namespace App\Http\Controllers\Promotor;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Rfq;
use App\Models\RfqOffer;
use App\Models\Vendor;
use App\Models\VendorBooking;
use App\Services\VendorMarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VendorController extends Controller
{
    public function __construct(private VendorMarketplaceService $marketplace) {}

    public function index(Request $request): JsonResponse
    {
        $vendors = Vendor::query()
            ->withCount('bookings')
            ->withSum('bookings as total_booked_amount', 'amount')
            ->orderBy('name')
            ->get();

        $summary = [
            'total_vendors' => $vendors->count(),
            'active_bookings' => (int) VendorBooking::query()
                ->whereIn('status', [VendorBooking::STATUS_REQUESTED, VendorBooking::STATUS_CONFIRMED, VendorBooking::STATUS_FULFILLED])
                ->count(),
            'released_bookings' => (int) VendorBooking::query()
                ->where('status', VendorBooking::STATUS_RELEASED)
                ->count(),
            'escrow_in_hold' => number_format((float) VendorBooking::query()
                ->whereIn('status', [VendorBooking::STATUS_REQUESTED, VendorBooking::STATUS_CONFIRMED, VendorBooking::STATUS_FULFILLED])
                ->sum('deposit'), 2, '.', ''),
            'categories' => $vendors->groupBy('category')->map->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'vendors' => $vendors,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', 'string', 'in:lighting,sound,catering,security,stage,transport,other'],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $vendor = Vendor::create([
            ...$data,
            'slug' => Str::slug($data['name']).'-'.Str::random(5),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vendor berhasil ditambahkan.',
            'data' => $vendor,
        ], 201);
    }

    public function update(Request $request, Vendor $vendor): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'category' => ['sometimes', 'string', 'in:lighting,sound,catering,security,stage,transport,other'],
            'contact_name' => ['nullable', 'string', 'max:150'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string', 'max:1000'],
            'rating' => ['sometimes', 'numeric', 'between:0,5'],
        ]);

        $vendor->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Vendor berhasil diperbarui.',
            'data' => $vendor,
        ]);
    }

    public function destroy(Vendor $vendor): JsonResponse
    {
        if ($vendor->bookings()->whereIn('status', [
            VendorBooking::STATUS_REQUESTED,
            VendorBooking::STATUS_CONFIRMED,
            VendorBooking::STATUS_FULFILLED,
        ])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor tidak dapat dihapus karena masih memiliki booking aktif.',
            ], 422);
        }

        $vendor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Vendor berhasil dihapus.',
        ]);
    }

    public function byEvent(Event $event): JsonResponse
    {
        $bookings = $event->vendorBookings()->with('vendor')->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'event' => ['id' => $event->id, 'title' => $event->title, 'slug' => $event->slug],
                'bookings' => $bookings,
            ],
        ]);
    }

    public function storeBooking(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'vendor_id' => ['required', 'exists:vendors,id'],
            'service' => ['nullable', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0', 'max:99999999999'],
            'deposit_pct' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'service_date' => ['nullable', 'date'],
        ]);

        $booking = $event->vendorBookings()->create([
            ...$data,
            'tenant_id' => $event->tenant_id,
            'deposit' => round(((float) $data['amount'] * (int) $data['deposit_pct']) / 100, 2),
            'status' => VendorBooking::STATUS_CONFIRMED,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking vendor berhasil dibuat.',
            'data' => $booking->load('vendor'),
        ], 201);
    }

    public function updateBooking(Request $request, VendorBooking $vendorBooking): JsonResponse
    {
        $data = $request->validate([
            'service' => ['nullable', 'string', 'max:150'],
            'amount' => ['sometimes', 'numeric', 'min:0', 'max:99999999999'],
            'deposit_pct' => ['sometimes', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'service_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'in:requested,confirmed,fulfilled'],
        ]);

        if ($vendorBooking->status === VendorBooking::STATUS_RELEASED) {
            return response()->json([
                'success' => false,
                'message' => 'Booking yang sudah dilepas tidak dapat diubah.',
            ], 422);
        }

        if (isset($data['amount'])) {
            $data['deposit'] = round(((float) $data['amount'] * (int) ($data['deposit_pct'] ?? $vendorBooking->deposit_pct)) / 100, 2);
        }

        $vendorBooking->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Booking diperbarui.',
            'data' => $vendorBooking->load('vendor'),
        ]);
    }

    public function destroyBooking(VendorBooking $vendorBooking): JsonResponse
    {
        if ($vendorBooking->status === VendorBooking::STATUS_RELEASED) {
            return response()->json([
                'success' => false,
                'message' => 'Booking yang sudah dilepas tidak dapat dihapus.',
            ], 422);
        }

        $vendorBooking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Booking dihapus.',
        ]);
    }

    public function release(VendorBooking $vendorBooking): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Pelepasan escrow diproses.',
            'data' => $this->marketplace->release($vendorBooking),
        ]);
    }

    public function rfqIndex(Request $request): JsonResponse
    {
        $rfqs = Rfq::query()
            ->with(['event:id,title,slug', 'offers.vendor:id,name'])
            ->when($request->filled('event_id'), fn ($q) => $q->where('event_id', $request->integer('event_id')))
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rfqs,
        ]);
    }

    public function rfqShow(Rfq $rfq): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $rfq->load(['event:id,title,slug', 'offers.vendor']),
        ]);
    }

    public function rfqStore(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'service' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'deadline' => ['nullable', 'date'],
        ]);

        $rfq = $event->rfqs()->create([
            ...$data,
            'tenant_id' => $event->tenant_id,
            'status' => Rfq::STATUS_OPEN,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'RFQ berhasil dibuat.',
            'data' => $rfq,
        ], 201);
    }

    public function offerStore(Request $request, Rfq $rfq): JsonResponse
    {
        $data = $request->validate([
            'vendor_id' => ['required', 'exists:vendors,id'],
            'quote' => ['required', 'numeric', 'min:0'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($rfq->status !== Rfq::STATUS_OPEN) {
            return response()->json([
                'success' => false,
                'message' => 'RFQ sudah tidak menerima penawaran.',
            ], 422);
        }

        $offer = $rfq->offers()->create([
            ...$data,
            'tenant_id' => $rfq->tenant_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran tercatat.',
            'data' => $offer->load('vendor'),
        ], 201);
    }

    public function award(Request $request, Rfq $rfq): JsonResponse
    {
        $data = $request->validate([
            'offer_id' => ['required', 'exists:rfq_offers,id'],
        ]);

        if ($rfq->status !== Rfq::STATUS_OPEN) {
            return response()->json([
                'success' => false,
                'message' => 'RFQ sudah tidak menerima penawaran.',
            ], 422);
        }

        $offer = $rfq->offers()->where('id', $data['offer_id'])->firstOrFail();
        $booking = $this->marketplace->award($rfq, $offer);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran dipilih dan booking dibuat.',
            'data' => $booking->load('vendor'),
        ]);
    }

    public function rfqDestroy(Rfq $rfq): JsonResponse
    {
        if ($rfq->status === Rfq::STATUS_AWARDED) {
            return response()->json([
                'success' => false,
                'message' => 'RFQ yang sudah dimenangkan tidak dapat dihapus.',
            ], 422);
        }

        $rfq->delete();

        return response()->json([
            'success' => true,
            'message' => 'RFQ dihapus.',
        ]);
    }

    public function offerDestroy(RfqOffer $rfqOffer): JsonResponse
    {
        if ($rfqOffer->rfq->status !== Rfq::STATUS_OPEN) {
            return response()->json([
                'success' => false,
                'message' => 'Penawaran pada RFQ tertutup tidak dapat dihapus.',
            ], 422);
        }

        $rfqOffer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Penawaran dihapus.',
        ]);
    }
}

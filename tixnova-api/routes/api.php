<?php

use App\Http\Controllers\Api\V1\PublicApiController as V1PublicApiController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Promotor\ApiPlatformController as PromotorApiPlatformController;
use App\Http\Controllers\Promotor\BlogController as PromotorBlogController;
use App\Http\Controllers\Promotor\CampaignController as PromotorCampaignController;
use App\Http\Controllers\Promotor\CrmController as PromotorCrmController;
use App\Http\Controllers\Promotor\DashboardController as PromotorDashboardController;
use App\Http\Controllers\Promotor\ErpController as PromotorErpController;
use App\Http\Controllers\Promotor\EventController as PromotorEventController;
use App\Http\Controllers\Promotor\InsightController as PromotorInsightController;
use App\Http\Controllers\Promotor\PricingController as PromotorPricingController;
use App\Http\Controllers\Promotor\PromotorCommunityController;
use App\Http\Controllers\Promotor\RefundController as PromotorRefundController;
use App\Http\Controllers\Promotor\ReportController as PromotorReportController;
use App\Http\Controllers\Promotor\ScanController as PromotorScanController;
use App\Http\Controllers\Promotor\SeatMapController as PromotorSeatMapController;
use App\Http\Controllers\Promotor\SponsorController as PromotorSponsorController;
use App\Http\Controllers\Promotor\TicketController as PromotorTicketController;
use App\Http\Controllers\Promotor\VendorController as PromotorVendorController;
use App\Http\Controllers\Promotor\VoucherController as PromotorVoucherController;
use App\Http\Controllers\Public\BlogController as PublicBlogController;
use App\Http\Controllers\Public\DistributionRedirectController;
use App\Http\Controllers\Public\EventController as PublicEventController;
use App\Http\Controllers\Public\PublicCommunityController;
use App\Http\Controllers\Public\SeatMapController as PublicSeatMapController;
use App\Http\Controllers\Public\WebhookController;
use App\Http\Controllers\SuperAdmin\AffiliateController;
use App\Http\Controllers\SuperAdmin\BlogController as SuperAdminBlogController;
use App\Http\Controllers\SuperAdmin\CommissionController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\EventApprovalController;
use App\Http\Controllers\SuperAdmin\OperationsController;
use App\Http\Controllers\SuperAdmin\RefundController as SuperAdminRefundController;
use App\Http\Controllers\SuperAdmin\ReportController;
use App\Http\Controllers\SuperAdmin\TenantController;
use App\Http\Controllers\SuperAdmin\TrustController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\User\CrmController as UserCrmController;
use App\Http\Controllers\User\DistributionLinkController;
use App\Http\Controllers\User\OrderController;
use App\Http\Controllers\User\PaymentController;
use App\Http\Controllers\User\ProfileController as UserProfileController;
use App\Http\Controllers\User\ReferralController;
use App\Http\Controllers\User\RefundController as UserRefundController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Auth ────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth_register');
    Route::post('/register/promotor', [AuthController::class, 'registerPromotor'])->middleware('throttle:auth_register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth')->name('password.email');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth')->name('password.reset');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/upload', [UploadController::class, 'upload']);
    });
});

// ─── User Profile & My Tickets ────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/profile', [UserProfileController::class, 'profile']);
    Route::put('/profile', [UserProfileController::class, 'update']);
    Route::get('/orders', [UserProfileController::class, 'orders']);
    Route::get('/tickets', [UserProfileController::class, 'tickets']);
    Route::get('/referrals', [ReferralController::class, 'index']);
    Route::post('/referrals/activate-affiliate', [ReferralController::class, 'activateAffiliate']);
    Route::post('/referrals/payout', [ReferralController::class, 'payout']);
    Route::get('/distribution-links', [DistributionLinkController::class, 'index']);
    Route::post('/distribution-links', [DistributionLinkController::class, 'store']);
    Route::delete('/distribution-links/{link}', [DistributionLinkController::class, 'destroy']);
    Route::get('/crm/summary', [UserCrmController::class, 'summary']);
    Route::get('/crm/recommendations', [UserCrmController::class, 'recommendations']);
    Route::get('/refunds', [UserRefundController::class, 'index']);
    Route::post('/orders/{code}/refunds', [UserRefundController::class, 'store']);
});

// ─── Public — Events ─────────────────────────────────────────────────────────
Route::prefix('events')->group(function () {
    Route::get('/featured', [PublicEventController::class, 'featured']);
    Route::get('/cities', [PublicEventController::class, 'cities']);
    Route::get('/{event:slug}/seat-map', [PublicSeatMapController::class, 'show']);
    Route::get('/', [PublicEventController::class, 'index']);
    Route::get('/{slug}', [PublicEventController::class, 'show']);
});

use App\Http\Controllers\User\VoucherController;

// ─── Public — Vouchers ────────────────────────────────────────────────────────
Route::post('/vouchers/apply', [VoucherController::class, 'apply']);

// ─── Public — Distribution ───────────────────────────────────────────────────
Route::get('/r/{code}', [DistributionRedirectController::class, 'redirect']);

// ─── Public — Communities ──────────────────────────────────────────────────
Route::get('/communities', [PublicCommunityController::class, 'index']);
Route::get('/communities/{community}', [PublicCommunityController::class, 'show']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/communities/{community}/join', [PublicCommunityController::class, 'join']);
    Route::post('/communities/{community}/leave', [PublicCommunityController::class, 'leave']);
});

// ─── Public — Categories ─────────────────────────────────────────────────────
Route::get('/categories', [PublicEventController::class, 'categories']);

// ─── Public — Blogs ──────────────────────────────────────────────────────────
Route::prefix('blogs')->group(function () {
    Route::get('/categories/list', [PublicBlogController::class, 'categories'])->name('blogs.categories');
    Route::get('/', [PublicBlogController::class, 'index'])->name('blogs.index');
    Route::get('/{slug}', [PublicBlogController::class, 'show'])->name('blogs.show');
});

// ─── Orders & Payments ───────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('orders')->group(function () {
        Route::post('/', [OrderController::class, 'store'])->middleware('throttle:checkout');
        Route::get('/{code}', [OrderController::class, 'show']);
        Route::post('/{code}/cancel', [OrderController::class, 'cancel']);
    });

    Route::prefix('payments')->group(function () {
        Route::post('/initiate', [PaymentController::class, 'initiate'])->middleware('throttle:checkout');
        Route::get('/{order_code}/status', [PaymentController::class, 'status']);
    });
});

// ─── Webhooks ────────────────────────────────────────────────────────────────
Route::prefix('webhooks')->group(function () {
    Route::post('/midtrans', [WebhookController::class, 'midtrans'])->middleware('throttle:webhooks');
    Route::post('/xendit', [WebhookController::class, 'xendit'])->middleware('throttle:webhooks');
});

// ─── Super Admin ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'check.role:super_admin', 'check.tenant'])
    ->prefix('super-admin')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('super-admin.dashboard');
        Route::get('/commission', [CommissionController::class, 'index'])->name('super-admin.commission.index');
        Route::put('/commission', [CommissionController::class, 'update'])->name('super-admin.commission.update');

        Route::apiResource('/tenants', TenantController::class)->except(['create', 'edit']);
        Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate']);
        Route::post('/tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
        Route::put('/tenants/{tenant}/commission', [TenantController::class, 'updateCommission']);

        Route::get('/events/pending', [EventApprovalController::class, 'pendingEvents']);
        Route::post('/events/{event}/approve', [EventApprovalController::class, 'approve']);
        Route::post('/events/{event}/reject', [EventApprovalController::class, 'reject']);
        Route::post('/events/{event}/toggle-featured', [EventApprovalController::class, 'toggleFeatured']);
        Route::get('/event-reschedules', [EventApprovalController::class, 'reschedules']);
        Route::post('/event-reschedules/{reschedule}/review', [EventApprovalController::class, 'reviewReschedule']);
        Route::get('/events', [OperationsController::class, 'events']);
        Route::get('/orders', [OperationsController::class, 'orders']);

        Route::apiResource('/blogs', SuperAdminBlogController::class)->except(['create', 'edit']);
        Route::post('/blogs/{blog}/toggle-publish', [SuperAdminBlogController::class, 'togglePublish']);

        Route::get('/reports/revenue', [ReportController::class, 'revenue']);
        Route::get('/reports/tenants', [ReportController::class, 'tenants']);
        Route::get('/reports/export', [ReportController::class, 'export']);
        Route::get('/refunds', [SuperAdminRefundController::class, 'index']);
        Route::post('/refunds/{refund}/process', [SuperAdminRefundController::class, 'process']);
        Route::post('/refunds/{refund}/confirm-manual', [SuperAdminRefundController::class, 'confirmManual']);
        Route::get('/affiliates', [AffiliateController::class, 'index']);
        Route::get('/affiliates/rewards', [AffiliateController::class, 'rewards']);
        Route::get('/affiliates/links', [AffiliateController::class, 'links']);
        Route::get('/trust', [TrustController::class, 'index']);
    });

// ─── Promotor ────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'check.role:promotor', 'check.tenant'])
    ->prefix('promotor')
    ->group(function () {
        Route::get('/dashboard/stats', [PromotorDashboardController::class, 'stats']);

        Route::get('/events/{event:id}/seat-map', [PromotorSeatMapController::class, 'show']);
        Route::put('/events/{event:id}/seat-map', [PromotorSeatMapController::class, 'upsert']);
        Route::apiResource('/events', PromotorEventController::class)->except(['create', 'edit']);
        Route::post('/events/{event}/banner', [PromotorEventController::class, 'uploadBanner']);
        Route::post('/events/{event}/publish', [PromotorEventController::class, 'publish']);
        Route::post('/events/{event:id}/reschedules', [PromotorEventController::class, 'requestReschedule']);

        Route::apiResource('/events/{event}/tickets', PromotorTicketController::class)->except(['create', 'edit']);

        Route::apiResource('/blogs', PromotorBlogController::class)->except(['create', 'edit']);
        Route::post('/blogs/{blog}/publish', [PromotorBlogController::class, 'publish']);
        Route::post('/blogs/{blog}/unpublish', [PromotorBlogController::class, 'unpublish']);
        Route::post('/blogs/{blog}/banner', [PromotorBlogController::class, 'uploadBanner']);

        Route::apiResource('/vouchers', PromotorVoucherController::class)->only(['index', 'store', 'destroy']);
        Route::get('/campaigns', [PromotorCampaignController::class, 'index']);
        Route::post('/campaigns', [PromotorCampaignController::class, 'store']);
        Route::get('/campaigns/{campaign}', [PromotorCampaignController::class, 'show']);
        Route::put('/campaigns/{campaign}', [PromotorCampaignController::class, 'update']);
        Route::post('/campaigns/{campaign}/activate', [PromotorCampaignController::class, 'activate']);
        Route::post('/campaigns/{campaign}/end', [PromotorCampaignController::class, 'end']);

        Route::get('/reports', [PromotorReportController::class, 'index']);
        Route::get('/events/{event}/reports', [PromotorReportController::class, 'eventReport']);
        Route::get('/reports/export', [PromotorReportController::class, 'export']);
        Route::get('/crm/segments', [PromotorCrmController::class, 'segments']);
        Route::get('/crm/segments/{segment}', [PromotorCrmController::class, 'segmentMembers']);
        Route::get('/crm/similar/{event}', [PromotorCrmController::class, 'similar']);
        Route::get('/crm/campaigns', [PromotorCrmController::class, 'campaigns']);
        Route::post('/crm/campaigns/preview', [PromotorCrmController::class, 'campaignPreview']);
        Route::post('/crm/campaigns', [PromotorCrmController::class, 'campaignStore']);
        Route::get('/crm/campaigns/{campaign}', [PromotorCrmController::class, 'campaignShow']);
        Route::post('/crm/campaigns/{campaign}/send', [PromotorCrmController::class, 'campaignSend']);
        Route::delete('/crm/campaigns/{campaign}', [PromotorCrmController::class, 'campaignDestroy']);

        Route::apiResource('/communities', PromotorCommunityController::class)->except(['create', 'edit']);
        Route::post('/communities/{community}/members/{member}/role', [PromotorCommunityController::class, 'updateMemberRole']);
        Route::delete('/communities/{community}/members/{member}', [PromotorCommunityController::class, 'removeMember']);
        Route::get('/communities/{community}/events', [PromotorCommunityController::class, 'communityEvents']);
        Route::post('/communities/{community}/events', [PromotorCommunityController::class, 'attachEvent']);
        Route::put('/communities/{community}/events/{communityEvent}', [PromotorCommunityController::class, 'updateEventShare']);
        Route::delete('/communities/{community}/events/{communityEvent}', [PromotorCommunityController::class, 'detachEvent']);
        Route::get('/communities/{community}/payouts', [PromotorCommunityController::class, 'payouts']);
        Route::get('/communities/{community}/summary', [PromotorCommunityController::class, 'summary']);

        Route::get('/pricing', [PromotorPricingController::class, 'index']);
        Route::get('/pricing/anomalies', [PromotorPricingController::class, 'anomalies']);
        Route::get('/pricing/{event}/forecast', [PromotorPricingController::class, 'forecast']);
        Route::get('/pricing/{event}', [PromotorPricingController::class, 'show']);

        Route::get('/insights/overview', [PromotorInsightController::class, 'overview']);
        Route::get('/insights/benchmark', [PromotorInsightController::class, 'benchmark']);
        Route::get('/insights/events/{event}/daily', [PromotorInsightController::class, 'daily']);
        Route::get('/insights/events/{event}', [PromotorInsightController::class, 'show']);
        Route::get('/sponsors', [PromotorSponsorController::class, 'index']);
        Route::post('/sponsors', [PromotorSponsorController::class, 'store']);
        Route::put('/sponsors/{sponsor}', [PromotorSponsorController::class, 'update']);
        Route::delete('/sponsors/{sponsor}', [PromotorSponsorController::class, 'destroy']);
        Route::get('/events/{event}/sponsorships', [PromotorSponsorController::class, 'byEvent']);
        Route::post('/events/{event}/sponsorships', [PromotorSponsorController::class, 'attach']);
        Route::put('/sponsorships/{sponsorship}', [PromotorSponsorController::class, 'updateSponsorship']);
        Route::delete('/sponsorships/{sponsorship}', [PromotorSponsorController::class, 'destroySponsorship']);
        Route::get('/events/{event}/poa', [PromotorSponsorController::class, 'poa']);
        Route::post('/sponsorships/{sponsorship}/release', [PromotorSponsorController::class, 'release']);

        Route::apiResource('/vendors', PromotorVendorController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/events/{event}/vendor-bookings', [PromotorVendorController::class, 'byEvent']);
        Route::post('/events/{event}/vendor-bookings', [PromotorVendorController::class, 'storeBooking']);
        Route::put('/vendor-bookings/{vendorBooking}', [PromotorVendorController::class, 'updateBooking']);
        Route::delete('/vendor-bookings/{vendorBooking}', [PromotorVendorController::class, 'destroyBooking']);
        Route::post('/vendor-bookings/{vendorBooking}/release', [PromotorVendorController::class, 'release']);
        Route::get('/rfqs', [PromotorVendorController::class, 'rfqIndex']);
        Route::get('/rfqs/{rfq}', [PromotorVendorController::class, 'rfqShow']);
        Route::post('/events/{event}/rfqs', [PromotorVendorController::class, 'rfqStore']);
        Route::post('/rfqs/{rfq}/offers', [PromotorVendorController::class, 'offerStore']);
        Route::post('/rfqs/{rfq}/award', [PromotorVendorController::class, 'award']);
        Route::delete('/rfqs/{rfq}', [PromotorVendorController::class, 'rfqDestroy']);
        Route::delete('/rfq-offers/{rfqOffer}', [PromotorVendorController::class, 'offerDestroy']);

        Route::get('/api-keys', [PromotorApiPlatformController::class, 'apiKeys']);
        Route::post('/api-keys', [PromotorApiPlatformController::class, 'apiKeyStore']);
        Route::post('/api-keys/{apiKey}/revoke', [PromotorApiPlatformController::class, 'apiKeyRevoke']);
        Route::delete('/api-keys/{apiKey}', [PromotorApiPlatformController::class, 'apiKeyDestroy']);
        Route::get('/webhooks', [PromotorApiPlatformController::class, 'webhooks']);
        Route::post('/webhooks', [PromotorApiPlatformController::class, 'webhookStore']);
        Route::post('/webhooks/{subscription}/test', [PromotorApiPlatformController::class, 'webhookTest']);
        Route::delete('/webhooks/{subscription}', [PromotorApiPlatformController::class, 'webhookDestroy']);
        Route::get('/webhooks/deliveries', [PromotorApiPlatformController::class, 'deliveries']);

        Route::get('/events/{event}/erp/overview', [PromotorErpController::class, 'overview']);
        Route::get('/events/{event}/erp/budget-items', [PromotorErpController::class, 'budgetIndex']);
        Route::post('/events/{event}/erp/budget-items', [PromotorErpController::class, 'budgetStore']);
        Route::put('/events/{event}/erp/budget-items/{item}', [PromotorErpController::class, 'budgetUpdate']);
        Route::delete('/events/{event}/erp/budget-items/{item}', [PromotorErpController::class, 'budgetDestroy']);
        Route::get('/events/{event}/erp/timeline', [PromotorErpController::class, 'timelineIndex']);
        Route::post('/events/{event}/erp/timeline', [PromotorErpController::class, 'timelineStore']);
        Route::put('/events/{event}/erp/timeline/{item}', [PromotorErpController::class, 'timelineUpdate']);
        Route::post('/events/{event}/erp/timeline/{item}/toggle', [PromotorErpController::class, 'timelineToggle']);
        Route::delete('/events/{event}/erp/timeline/{item}', [PromotorErpController::class, 'timelineDestroy']);
        Route::get('/events/{event}/erp/checklists', [PromotorErpController::class, 'checklistIndex']);
        Route::post('/events/{event}/erp/checklists', [PromotorErpController::class, 'checklistStore']);
        Route::post('/events/{event}/erp/checklists/{item}/toggle', [PromotorErpController::class, 'checklistToggle']);
        Route::delete('/events/{event}/erp/checklists/{item}', [PromotorErpController::class, 'checklistDestroy']);
        Route::get('/refunds', [PromotorRefundController::class, 'index']);
        Route::post('/refunds/{refund}/review', [PromotorRefundController::class, 'review']);

        Route::post('/events/{event:id}/scan', [PromotorScanController::class, 'scan'])->middleware('throttle:scan');
    });

// ─── Public API v1 (API key) ─────────────────────────────────────────────────
Route::prefix('v1')
    ->middleware(['auth.api-key:read', 'throttle:public_api'])
    ->group(function () {
        Route::get('/events', [V1PublicApiController::class, 'events']);
        Route::get('/events/{identifier}', [V1PublicApiController::class, 'show']);
        Route::get('/events/{identifier}/widget', [V1PublicApiController::class, 'widget']);
        Route::get('/orders', [V1PublicApiController::class, 'orders']);
        Route::get('/orders/{id}', [V1PublicApiController::class, 'order'])->whereNumber('id');
        Route::get('/webhooks', [V1PublicApiController::class, 'webhooks']);
        Route::post('/webhooks', [V1PublicApiController::class, 'webhookStore'])->middleware('auth.api-key:write');
        Route::delete('/webhooks/{id}', [V1PublicApiController::class, 'webhookDestroy'])->middleware('auth.api-key:write');
    });

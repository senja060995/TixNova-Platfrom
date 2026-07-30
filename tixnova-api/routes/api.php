<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Public\EventController as PublicEventController;
use App\Http\Controllers\Public\BlogController as PublicBlogController;
use App\Http\Controllers\User\OrderController;
use App\Http\Controllers\User\ProfileController as UserProfileController;
use App\Http\Controllers\SuperAdmin\DashboardController;
use App\Http\Controllers\SuperAdmin\TenantController;
use App\Http\Controllers\SuperAdmin\EventApprovalController;
use App\Http\Controllers\SuperAdmin\CommissionController;
use App\Http\Controllers\SuperAdmin\ReportController;
use App\Http\Controllers\Promotor\BlogController as PromotorBlogController;
use App\Http\Controllers\Promotor\EventController as PromotorEventController;
use App\Http\Controllers\Promotor\TicketController as PromotorTicketController;
use App\Http\Controllers\Promotor\DashboardController as PromotorDashboardController;
use App\Http\Controllers\Promotor\ScanController as PromotorScanController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\SuperAdmin\BlogController as SuperAdminBlogController;
use App\Http\Controllers\User\PaymentController;
use App\Http\Controllers\Public\WebhookController;
use App\Http\Controllers\Promotor\VoucherController as PromotorVoucherController;
use App\Http\Controllers\Promotor\ReportController as PromotorReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Auth ────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register',          [AuthController::class, 'register']);
    Route::post('/register/promotor', [AuthController::class, 'registerPromotor']);
    Route::post('/login',             [AuthController::class, 'login']);
    Route::post('/forgot-password',   [AuthController::class, 'forgotPassword'])->name('password.email');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',      [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/upload', [UploadController::class, 'upload']);
    });
});

// ─── User Profile & My Tickets ────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/profile',  [UserProfileController::class, 'profile']);
    Route::put('/profile',  [UserProfileController::class, 'update']);
    Route::get('/orders',   [UserProfileController::class, 'orders']);
    Route::get('/tickets',  [UserProfileController::class, 'tickets']);
});

// ─── Public — Events ─────────────────────────────────────────────────────────
Route::prefix('events')->group(function () {
    Route::get('/featured', [PublicEventController::class, 'featured']);
    Route::get('/cities',   [PublicEventController::class, 'cities']);
    Route::get('/',         [PublicEventController::class, 'index']);
    Route::get('/{slug}',   [PublicEventController::class, 'show']);
});

use App\Http\Controllers\User\VoucherController;

// ─── Public — Vouchers ────────────────────────────────────────────────────────
Route::post('/vouchers/apply', [VoucherController::class, 'apply']);

// ─── Public — Categories ─────────────────────────────────────────────────────
Route::get('/categories', [PublicEventController::class, 'categories']);

// ─── Public — Blogs ──────────────────────────────────────────────────────────
Route::prefix('blogs')->group(function () {
    Route::get('/categories/list', [PublicBlogController::class, 'categories'])->name('blogs.categories');
    Route::get('/',                [PublicBlogController::class, 'index'])->name('blogs.index');
    Route::get('/{slug}',          [PublicBlogController::class, 'show'])->name('blogs.show');
});

// ─── Orders ──────────────────────────────────────────────────────────────────
Route::prefix('orders')->group(function () {
    Route::post('/',                     [OrderController::class, 'store']);
    Route::get('/{code}',                [OrderController::class, 'show']);
    Route::post('/{code}/pay-simulation', [OrderController::class, 'paySimulation']);
    Route::post('/{code}/cancel',        [OrderController::class, 'cancel']);
});

// ─── Payments ────────────────────────────────────────────────────────────────
Route::prefix('payments')->group(function () {
    Route::post('/initiate',           [PaymentController::class, 'initiate']);
    Route::get('/{order_code}/status', [PaymentController::class, 'status']);
});

// ─── Webhooks ────────────────────────────────────────────────────────────────
Route::prefix('webhooks')->group(function () {
    Route::post('/midtrans', [WebhookController::class, 'midtrans']);
    Route::post('/xendit',   [WebhookController::class, 'xendit']);
});

// ─── Super Admin ─────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'check.role:super_admin', 'check.tenant'])
    ->prefix('super-admin')
    ->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('super-admin.dashboard');
        Route::get('/commission', [CommissionController::class, 'index'])->name('super-admin.commission.index');
        Route::put('/commission', [CommissionController::class, 'update'])->name('super-admin.commission.update');

        Route::apiResource('/tenants', TenantController::class)->except(['create', 'edit']);
        Route::post('/tenants/{tenant}/activate',  [TenantController::class, 'activate']);
        Route::post('/tenants/{tenant}/suspend',   [TenantController::class, 'suspend']);
        Route::put('/tenants/{tenant}/commission', [TenantController::class, 'updateCommission']);

        Route::get('/events/pending',                  [EventApprovalController::class, 'pendingEvents']);
        Route::post('/events/{event}/approve',         [EventApprovalController::class, 'approve']);
        Route::post('/events/{event}/reject',          [EventApprovalController::class, 'reject']);
        Route::post('/events/{event}/toggle-featured', [EventApprovalController::class, 'toggleFeatured']);

        Route::apiResource('/blogs', SuperAdminBlogController::class)->except(['create', 'edit']);
        Route::post('/blogs/{blog}/toggle-publish', [SuperAdminBlogController::class, 'togglePublish']);

        Route::get('/reports/revenue', [ReportController::class, 'revenue']);
        Route::get('/reports/tenants', [ReportController::class, 'tenants']);
        Route::get('/reports/export',  [ReportController::class, 'export']);
    });

// ─── Promotor ────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'check.role:promotor', 'check.tenant'])
    ->prefix('promotor')
    ->group(function () {
        Route::get('/dashboard/stats', [PromotorDashboardController::class, 'stats']);

        Route::apiResource('/events', PromotorEventController::class)->except(['create', 'edit']);
        Route::post('/events/{event}/banner',  [PromotorEventController::class, 'uploadBanner']);
        Route::post('/events/{event}/publish', [PromotorEventController::class, 'publish']);

        Route::apiResource('/events/{event}/tickets', PromotorTicketController::class)->except(['create', 'edit']);

        Route::apiResource('/blogs', PromotorBlogController::class)->except(['create', 'edit']);
        Route::post('/blogs/{blog}/publish',   [PromotorBlogController::class, 'publish']);
        Route::post('/blogs/{blog}/unpublish', [PromotorBlogController::class, 'unpublish']);
        Route::post('/blogs/{blog}/banner',    [PromotorBlogController::class, 'uploadBanner']);

        Route::apiResource('/vouchers', PromotorVoucherController::class)->only(['index', 'store', 'destroy']);

        Route::get('/events/{event}/reports', [PromotorReportController::class, 'eventReport']);
        Route::get('/reports/export',         [PromotorReportController::class, 'export']);

        Route::post('/scan', [PromotorScanController::class, 'scan']);
    });
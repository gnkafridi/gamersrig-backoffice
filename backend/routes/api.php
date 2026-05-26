<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\InvestmentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\CodRecordController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\FinanceExportController;
use App\Http\Controllers\Api\LedgerController;
use App\Http\Controllers\Api\ReimbursementController;
use App\Http\Controllers\Api\MonthlyInvestmentController;
use App\Http\Controllers\Api\StockPurchaseController;
use App\Http\Controllers\Api\LedgerExportController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\VendorProductController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\SearchController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::patch('/user/preferences', [AuthController::class, 'updatePreferences']);
    Route::patch('/profile', [AuthController::class, 'updateProfile']);
    Route::patch('/profile/password', [AuthController::class, 'changePassword']);

    Route::apiResource('products', ProductController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::get('categories-parents', [CategoryController::class, 'parents']);
    Route::get('categories-all', [CategoryController::class, 'allForFilter']);
    Route::apiResource('brands', BrandController::class);

    Route::get('products/meta/categories', [ProductController::class, 'categories']);
    Route::get('products/meta/brands', [ProductController::class, 'brands']);
    Route::get('products/meta/category-stats', [ProductController::class, 'categoryStats']);
    Route::get('products/meta/brand-stats', [ProductController::class, 'brandStats']);
    Route::post('products/{id}/restore', [ProductController::class, 'restore']);
    Route::post('products/{product}/restock',  [ProductController::class, 'restock']);
    Route::get('products/{product}/purchases', [ProductController::class, 'purchases']);
    Route::patch('products/{product}/receive', [ProductController::class, 'markReceived']);

    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{id}/restore', [CustomerController::class, 'restore']);

    Route::apiResource('orders', OrderController::class);
    Route::post('orders/{id}/restore', [OrderController::class, 'restore']);
    Route::get('orders/{order}/pdf', [OrderController::class, 'pdf']);
    Route::get('orders/{order}/timeline', [OrderController::class, 'timeline']);
    Route::patch('orders/{order}/items/{item}/map', [OrderController::class, 'mapItem']);

    Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('analytics/monthly-revenue', [AnalyticsController::class, 'monthlyRevenue']);
    Route::get('analytics/top-products', [AnalyticsController::class, 'topProducts']);
    Route::get('analytics/revenue-by-period', [AnalyticsController::class, 'revenueByPeriod']);
    Route::get('analytics/sales-report', [AnalyticsController::class, 'salesReport']);
    Route::get('analytics/sales-by-category', [AnalyticsController::class, 'salesByCategory']);
    Route::get('analytics/product-performance', [AnalyticsController::class, 'productPerformance']);
    Route::get('analytics/sales-trend', [AnalyticsController::class, 'salesTrend']);
    Route::get('analytics/sales-by-payment', [AnalyticsController::class, 'salesByPayment']);
    Route::get('analytics/sales-by-brand', [AnalyticsController::class, 'salesByBrand']);

    // ── Finance Module ──────────────────────────────────────────
    Route::apiResource('partners', PartnerController::class);
    Route::apiResource('finance/investments', InvestmentController::class)
        ->parameters(['investments' => 'investment']);
    Route::apiResource('finance/expenses', ExpenseController::class)
        ->parameters(['expenses' => 'expense']);
    Route::apiResource('finance/cod', CodRecordController::class)
        ->parameters(['cod' => 'cod']);
    Route::patch('finance/cod/{cod}/received', [CodRecordController::class, 'markReceived']);
    Route::get('finance/overview', [FinanceController::class, 'overview']);
    Route::get('finance/settlement', [FinanceController::class, 'settlement']);
    Route::post('finance/settlement/finalize', [FinanceController::class, 'settlementFinalize']);
    Route::get('finance/revenue', [FinanceController::class, 'revenue']);
    Route::get('finance/quarterly', [FinanceController::class, 'quarterly']);
    Route::post('finance/quarterly/finalize', [FinanceController::class, 'quarterlyFinalize']);

    // Monthly agreed investment (shared budget per month)
    Route::get('finance/monthly-investments', [MonthlyInvestmentController::class, 'index']);
    Route::post('finance/monthly-investments', [MonthlyInvestmentController::class, 'store']);
    Route::delete('finance/monthly-investments/{monthlyInvestment}', [MonthlyInvestmentController::class, 'destroy']);

    // Stock spent = product purchases (unified stock-spent + inventory line items)
    Route::get('finance/stock-purchases', [StockPurchaseController::class, 'index']);
    Route::post('finance/stock-purchases/batch', [StockPurchaseController::class, 'storeBatch']);
    Route::post('finance/stock-purchases', [StockPurchaseController::class, 'store']);
    Route::post('finance/stock-purchases/{stockPurchase}', [StockPurchaseController::class, 'update']);
    Route::delete('finance/stock-purchases/{stockPurchase}', [StockPurchaseController::class, 'destroy']);

    // Partner contribution ledger (who-owes-whom) + reimbursements
    Route::get('finance/ledger', [LedgerController::class, 'index']);
    Route::get('finance/ledger/export/{type}', [LedgerExportController::class, 'export']);
    Route::apiResource('finance/reimbursements', ReimbursementController::class)
        ->parameters(['reimbursements' => 'reimbursement']);

    // Reports / exports
    Route::get('finance/reports/{type}/pdf', [FinanceExportController::class, 'pdf']);
    Route::get('finance/reports/{type}/csv', [FinanceExportController::class, 'csv']);

    // ── Vendors & Partner Products ─────────────────────────────
    Route::get('vendors/meta/list', [VendorController::class, 'list']);
    Route::get('vendors/meta/commission-report', [VendorController::class, 'commissionReport']);
    Route::apiResource('vendors', VendorController::class);
    Route::apiResource('vendor-products', VendorProductController::class)
        ->parameters(['vendor-products' => 'vendorProduct']);
    Route::post('vendor-products/{id}/restore', [VendorProductController::class, 'restore']);

    // ── Global Search ──────────────────────────────────────────
    Route::get('search', [SearchController::class, 'search']);

    // ── User Management + Audit Log ────────────────────────────
    Route::apiResource('users', UserController::class);
    Route::get('audit-logs', [AuditLogController::class, 'index']);
});

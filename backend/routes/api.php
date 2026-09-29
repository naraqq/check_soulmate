<?php

use App\Http\Controllers\Api\AssessmentController;
use App\Http\Controllers\Api\ConfigController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::get('/config', ConfigController::class)->middleware('throttle:api');

Route::post('/assessments', [AssessmentController::class, 'store'])->middleware('throttle:assessment-create');

// {assessment} is the 48-char random public token (pattern registered in AppServiceProvider).
Route::prefix('/assessments/{assessment}')->group(function () {
    Route::get('/', [AssessmentController::class, 'show'])->middleware('throttle:api');
    Route::delete('/', [AssessmentController::class, 'destroy'])->middleware('throttle:api');

    Route::post('/payment', [PaymentController::class, 'store'])->middleware('throttle:payment');
    Route::get('/payment-status', [PaymentController::class, 'status'])->middleware('throttle:payment-status');

    Route::post('/generate-report', [ReportController::class, 'generate'])->middleware('throttle:report-generate');
    Route::get('/report', [ReportController::class, 'show'])->middleware('throttle:api');

    // Test payment bypass. Always routed (so route:cache can't freeze the setting);
    // the controller returns 404 unless PaymentBypass::enabled().
    Route::post('/dev/mark-paid', [PaymentController::class, 'devMarkPaid'])->middleware('throttle:payment');
});

Route::match(['get', 'post'], '/payments/qpay/callback/{reference}', [PaymentController::class, 'callback'])
    ->where('reference', 'SC[A-F0-9]{24}')
    ->middleware('throttle:payment-status');

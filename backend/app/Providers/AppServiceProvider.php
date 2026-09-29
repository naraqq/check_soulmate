<?php

namespace App\Providers;

use App\Models\Assessment;
use App\Services\Payments\FakePaymentGateway;
use App\Services\Payments\PaymentGateway;
use App\Services\QPayService;
use App\Services\Questionnaire;
use App\Support\PaymentBypass;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Questionnaire::class, fn () => new Questionnaire(config('soulmate.questionnaire_path')));

        // Local development without QPay credentials uses a placeholder gateway —
        // only when the dev bypass is active (which is impossible in production).
        $this->app->bind(PaymentGateway::class, function ($app) {
            if (blank(config('services.qpay.username')) && PaymentBypass::enabled()) {
                return new FakePaymentGateway;
            }

            return $app->make(QPayService::class);
        });
    }

    public function boot(): void
    {
        Route::pattern('assessment', Assessment::TOKEN_PATTERN);

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        $tooMany = fn () => response()->json([
            'code' => 'rate_limited',
            'message' => 'Too many requests. Please wait a moment and try again.',
        ], 429);

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->ip())->response($tooMany));

        RateLimiter::for('assessment-create', fn (Request $request) => [
            Limit::perMinute(10)->by($request->ip())->response($tooMany),
            Limit::perDay(100)->by($request->ip())->response($tooMany),
        ]);

        RateLimiter::for('payment', fn (Request $request) => Limit::perMinute(20)->by($request->ip())->response($tooMany));

        RateLimiter::for('payment-status', fn (Request $request) => Limit::perMinute(60)->by($request->ip())->response($tooMany));

        // Generation is also capped per assessment (soulmate.max_generation_attempts).
        RateLimiter::for('report-generate', fn (Request $request) => Limit::perMinute(10)->by($request->ip())->response($tooMany));
    }
}

<?php

use App\Http\Middleware\ApiSecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [ApiSecurityHeaders::class]);

        // Nginx + PHP-FPM on the same host passes the real client IP already.
        // If you put an AWS load balancer in front, trust its address range here
        // so rate limiting sees client IPs, e.g. trustProxies(at: '10.0.0.0/8').
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());

        // Don't reveal model names or internals for unknown/invalid tokens.
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['code' => 'not_found', 'message' => 'Not found.'], 404);
            }
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($request->is('api/*') && $e->getStatusCode() === 429) {
                return response()->json(['code' => 'rate_limited', 'message' => 'Too many requests.'], 429);
            }
        });
    })->create();

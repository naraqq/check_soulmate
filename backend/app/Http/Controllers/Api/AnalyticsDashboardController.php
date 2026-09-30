<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsDashboardController extends Controller
{
    public function __construct(private readonly Analytics $analytics) {}

    /** GET /api/admin/analytics?days=30 — requires `Authorization: Bearer <ANALYTICS_DASHBOARD_KEY>`. */
    public function show(Request $request): JsonResponse
    {
        $key = (string) config('soulmate.analytics_key');
        // No key configured = the dashboard doesn't exist.
        abort_if($key === '', 404);

        if (! hash_equals($key, (string) $request->bearerToken())) {
            return response()->json(['code' => 'unauthorized'], 401);
        }

        $request->validate(['days' => ['nullable', 'integer', 'in:7,30,90,365']]);
        $days = $request->integer('days', 30) ?: 30;

        return response()->json($this->analytics->dashboard($days));
    }
}

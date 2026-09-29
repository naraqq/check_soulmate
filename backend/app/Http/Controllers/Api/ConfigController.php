<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/** Public, non-secret configuration for the frontend (price is set only on the backend). */
class ConfigController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'price' => (int) config('soulmate.price'),
            'currency' => config('soulmate.currency'),
        ]);
    }
}

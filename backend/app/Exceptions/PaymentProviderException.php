<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/** QPay (or another provider) is unreachable, misconfigured or returned an error. */
class PaymentProviderException extends RuntimeException
{
    public function render(): JsonResponse
    {
        return response()->json([
            'code' => 'payment_provider_unavailable',
            'message' => 'The payment provider is temporarily unavailable.',
        ], 503);
    }
}

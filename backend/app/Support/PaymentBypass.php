<?php

namespace App\Support;

/**
 * Development-only payment bypass. Never active in production, regardless of
 * the PAYMENT_BYPASS setting.
 */
final class PaymentBypass
{
    public static function enabled(): bool
    {
        return config('soulmate.payment_bypass') === true && ! app()->environment('production');
    }
}

<?php

namespace App\Support;

/**
 * Test payment bypass ("skip QPay" button).
 *
 * - soulmate.payment_bypass_forced (TEMPORARY, set in config/soulmate.php) turns it on everywhere.
 * - Otherwise it needs PAYMENT_BYPASS=true, and in production also PAYMENT_BYPASS_IN_PRODUCTION=true.
 */
final class PaymentBypass
{
    public static function enabled(): bool
    {
        if (config('soulmate.payment_bypass_forced') === true) {
            return true;
        }

        if (config('soulmate.payment_bypass') !== true) {
            return false;
        }

        return ! app()->environment('production') || config('soulmate.payment_bypass_in_production') === true;
    }
}

<?php

namespace App\Support;

/**
 * Test payment bypass. Needs PAYMENT_BYPASS=true; in production it also needs
 * PAYMENT_BYPASS_IN_PRODUCTION=true, so it can never switch on by accident.
 */
final class PaymentBypass
{
    public static function enabled(): bool
    {
        if (config('soulmate.payment_bypass') !== true) {
            return false;
        }

        return ! app()->environment('production') || config('soulmate.payment_bypass_in_production') === true;
    }
}

<?php

namespace App\Support;

/** Test payments are available only in local and test environments. */
final class PaymentBypass
{
    public static function enabled(): bool
    {
        // Ignore legacy force/production flags, including stale cached settings.
        return app()->environment(['local', 'testing'])
            && config('soulmate.payment_bypass') === true;
    }
}

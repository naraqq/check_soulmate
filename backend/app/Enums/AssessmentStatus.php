<?php

namespace App\Enums;

enum AssessmentStatus: string
{
    case Created = 'created';
    case PaymentPending = 'payment_pending';
    case Paid = 'paid';
    case Generating = 'generating';
    case Completed = 'completed';
    case Failed = 'failed';

    /** Has payment been independently confirmed by the backend? */
    public function isPaid(): bool
    {
        return in_array($this, [self::Paid, self::Generating, self::Completed, self::Failed], true);
    }
}

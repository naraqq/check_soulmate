<?php

namespace App\Services\Payments;

final readonly class PaymentCheckResult
{
    /**
     * @param  array<string, mixed>  $raw  Provider response, stored on the payment
     */
    public function __construct(
        public bool $paid,
        public int $paidAmount,
        public ?string $providerPaymentId,
        public array $raw,
    ) {}

    public static function unpaid(array $raw = []): self
    {
        return new self(false, 0, null, $raw);
    }
}

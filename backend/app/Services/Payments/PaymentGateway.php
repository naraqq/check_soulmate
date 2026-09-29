<?php

namespace App\Services\Payments;

use App\Models\Payment;

/**
 * A payment provider. Implementations must verify payment state server-side
 * with the provider — the frontend's word is never trusted.
 */
interface PaymentGateway
{
    /** Short provider id stored on payments.provider, e.g. "qpay". */
    public function name(): string;

    public function createInvoice(Payment $payment, string $description): InvoiceData;

    public function checkPayment(Payment $payment): PaymentCheckResult;
}

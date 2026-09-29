<?php

namespace App\Services\Payments;

use App\Models\Payment;

/**
 * Local development gateway, used only when PAYMENT_BYPASS is enabled outside
 * production and no QPay credentials are configured. It issues a placeholder
 * invoice and never reports payment on its own — use the dev bypass endpoint
 * to mark an assessment as paid.
 */
class FakePaymentGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'fake';
    }

    public function createInvoice(Payment $payment, string $description): InvoiceData
    {
        return new InvoiceData(
            invoiceId: 'fake_'.$payment->reference,
            qrText: 'SOULMATE-CHECK-DEV-'.$payment->reference,
            qrImage: null,
            shortUrl: null,
            deeplinks: [],
            raw: ['fake' => true, 'description' => $description],
        );
    }

    public function checkPayment(Payment $payment): PaymentCheckResult
    {
        return PaymentCheckResult::unpaid(['fake' => true]);
    }
}

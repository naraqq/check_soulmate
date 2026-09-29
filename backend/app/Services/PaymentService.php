<?php

namespace App\Services;

use App\Enums\AssessmentStatus;
use App\Enums\PaymentStatus;
use App\Models\Assessment;
use App\Models\Payment;
use App\Services\Payments\PaymentCheckResult;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Orchestrates invoices and payment confirmation for assessments. Only this
 * service moves an assessment into the "paid" state, and only after the
 * gateway has confirmed payment with the provider.
 */
class PaymentService
{
    /** Reuse an unpaid invoice for this long instead of issuing a new one. */
    private const INVOICE_REUSE_HOURS = 12;

    public function __construct(private readonly PaymentGateway $gateway) {}

    /**
     * Return the current pending invoice for an assessment, creating one if needed.
     * Idempotent: repeated calls (page refreshes) reuse the same invoice.
     */
    public function invoiceFor(Assessment $assessment): Payment
    {
        return Cache::lock("assessment:{$assessment->id}:invoice", 20)->block(10, function () use ($assessment) {
            $existing = $assessment->payments()
                ->where('provider', $this->gateway->name())
                ->where('status', PaymentStatus::Pending)
                ->where('amount', $this->price())
                ->whereNotNull('provider_invoice_id')
                ->where('created_at', '>=', now()->subHours(self::INVOICE_REUSE_HOURS))
                ->latest('id')
                ->first();

            if ($existing) {
                return $existing;
            }

            $payment = $assessment->payments()->create([
                'provider' => $this->gateway->name(),
                'reference' => Payment::generateReference(),
                'amount' => $this->price(),
                'currency' => config('soulmate.currency'),
                'status' => PaymentStatus::Pending,
            ]);

            try {
                $invoice = $this->gateway->createInvoice($payment, 'Lemony тайлан');
            } catch (Throwable $e) {
                $payment->update(['status' => PaymentStatus::Failed]);
                throw $e;
            }

            $payment->update([
                'provider_invoice_id' => $invoice->invoiceId,
                'provider_response_json' => ['invoice' => $invoice->toDisplayArray() + ['invoice_id' => $invoice->invoiceId]],
            ]);

            if ($assessment->status === AssessmentStatus::Created) {
                $assessment->update(['status' => AssessmentStatus::PaymentPending]);
            }

            return $payment;
        });
    }

    /** Ask the provider about every recent pending invoice; marks the assessment paid if confirmed. */
    public function refresh(Assessment $assessment): Assessment
    {
        if ($assessment->status->isPaid()) {
            return $assessment;
        }

        $pending = $assessment->payments()
            ->where('status', PaymentStatus::Pending)
            ->whereNotNull('provider_invoice_id')
            ->latest('id')
            ->limit(3)
            ->get();

        foreach ($pending as $payment) {
            if ($this->refreshPayment($payment)) {
                break;
            }
        }

        return $assessment->refresh();
    }

    /** Verify a single payment with its provider. Returns true when confirmed paid. */
    public function refreshPayment(Payment $payment): bool
    {
        if ($payment->status === PaymentStatus::Paid) {
            return true;
        }

        // A payment created by another gateway (e.g. before switching config) can't be checked here.
        if ($payment->provider !== $this->gateway->name()) {
            return false;
        }

        $result = $this->gateway->checkPayment($payment);

        if (! $result->paid) {
            return false;
        }

        $this->markPaid($payment, $result);

        return true;
    }

    public function markPaid(Payment $payment, PaymentCheckResult $result): void
    {
        DB::transaction(function () use ($payment, $result) {
            /** @var Payment $locked */
            $locked = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if ($locked->status !== PaymentStatus::Paid) {
                $locked->update([
                    'status' => PaymentStatus::Paid,
                    'paid_at' => now(),
                    'provider_response_json' => array_merge($locked->provider_response_json ?? [], [
                        'confirmation' => $result->raw,
                        'provider_payment_id' => $result->providerPaymentId,
                    ]),
                ]);
            }

            if ($locked->assessment_id !== null) {
                Assessment::query()
                    ->whereKey($locked->assessment_id)
                    ->whereIn('status', [AssessmentStatus::Created, AssessmentStatus::PaymentPending])
                    ->update(['status' => AssessmentStatus::Paid, 'paid_at' => now()]);
            }
        });
    }

    /** Development bypass: record a synthetic paid payment. Callers must check PaymentBypass::enabled(). */
    public function markPaidWithoutProvider(Assessment $assessment): void
    {
        $payment = $assessment->payments()->create([
            'provider' => 'dev_bypass',
            'reference' => Payment::generateReference(),
            'amount' => $this->price(),
            'currency' => config('soulmate.currency'),
            'status' => PaymentStatus::Pending,
        ]);

        $this->markPaid($payment, new PaymentCheckResult(true, $payment->amount, null, ['dev_bypass' => true]));
    }

    /** @return array<string, mixed>|null */
    public function invoiceDisplay(Payment $payment): ?array
    {
        $invoice = $payment->provider_response_json['invoice'] ?? null;

        return is_array($invoice) ? array_intersect_key($invoice, array_flip(['qr_text', 'qr_image', 'short_url', 'deeplinks'])) : null;
    }

    public function price(): int
    {
        return (int) config('soulmate.price');
    }
}

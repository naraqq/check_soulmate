<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Support\PaymentBypass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    /** POST /api/assessments/{token}/payment — create (or reuse) a QPay invoice. */
    public function store(Assessment $assessment): JsonResponse
    {
        if ($assessment->status->isPaid()) {
            return $this->statusResponse($assessment);
        }

        $payment = $this->payments->invoiceFor($assessment);

        return response()->json([
            'status' => 'pending',
            'assessment_status' => $assessment->refresh()->status->value,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'invoice' => $this->payments->invoiceDisplay($payment),
            'dev_bypass' => PaymentBypass::enabled(),
        ]);
    }

    /** GET /api/assessments/{token}/payment-status — verified with QPay, never trusted from the client. */
    public function status(Assessment $assessment): JsonResponse
    {
        return $this->statusResponse($this->payments->refresh($assessment));
    }

    /**
     * QPay callback. The request itself is not trusted: it only triggers an
     * independent verification against the QPay API.
     */
    public function callback(string $reference): Response
    {
        $payment = Payment::query()->where('reference', $reference)->first();

        if ($payment !== null) {
            $this->payments->refreshPayment($payment);
        }

        return response('SUCCESS', 200)->header('Content-Type', 'text/plain');
    }

    /** POST /api/assessments/{token}/dev/mark-paid — 404 unless PaymentBypass::enabled(). */
    public function devMarkPaid(Assessment $assessment): JsonResponse
    {
        abort_unless(PaymentBypass::enabled(), 404);

        if (! $assessment->status->isPaid()) {
            $this->payments->markPaidWithoutProvider($assessment);
        }

        return $this->statusResponse($assessment->refresh());
    }

    private function statusResponse(Assessment $assessment): JsonResponse
    {
        return response()->json([
            'status' => $assessment->status->isPaid() ? 'paid' : 'pending',
            'assessment_status' => $assessment->status->value,
        ]);
    }
}

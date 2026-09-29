<?php

namespace Tests\Feature;

use App\Enums\AssessmentStatus;
use App\Enums\PaymentStatus;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    public function test_creates_qpay_invoice_and_returns_display_data(): void
    {
        $this->fakeQPay();
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/payment")
            ->assertOk()
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('amount', 7900)
            ->assertJsonPath('currency', 'MNT')
            ->assertJsonPath('invoice.qr_text', '0002010102121531...')
            ->assertJsonPath('invoice.deeplinks.0.link', 'khanbank://q?qPay_QRcode=abc')
            ->assertJsonMissingPath('invoice.invoice_id');

        $this->assertSame(AssessmentStatus::PaymentPending, $assessment->refresh()->status);

        $payment = Payment::firstOrFail();
        $this->assertSame('inv_123', $payment->provider_invoice_id);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://qpay.test/v2/invoice'
            && $request['amount'] === 7900
            && $request['invoice_code'] === 'TEST_INVOICE'
            && $request['sender_invoice_no'] === $payment->reference
            && $request['callback_url'] === 'https://app.test/api/payments/qpay/callback/'.$payment->reference
            && $request->hasHeader('Authorization', 'Bearer qpay-token'));
    }

    public function test_invoice_is_reused_on_refresh(): void
    {
        $this->fakeQPay();
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/payment")->assertOk();
        $this->postJson("/api/assessments/{$assessment->public_token}/payment")->assertOk();

        $this->assertDatabaseCount('payments', 1);
        Http::assertSentCount(2); // one auth + one invoice
    }

    public function test_qpay_outage_returns_friendly_error(): void
    {
        Http::fake(['qpay.test/*' => Http::response(['error' => 'down'], 500)]);
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/payment")
            ->assertStatus(503)
            ->assertJsonPath('code', 'payment_provider_unavailable');

        $this->assertSame(PaymentStatus::Failed, Payment::firstOrFail()->status);
    }

    public function test_payment_status_stays_pending_until_qpay_confirms(): void
    {
        $this->fakeQPay(paid: false);
        $assessment = $this->createAssessment();
        $this->postJson("/api/assessments/{$assessment->public_token}/payment");

        $this->getJson("/api/assessments/{$assessment->public_token}/payment-status")
            ->assertOk()
            ->assertJsonPath('status', 'pending');

        $this->assertSame(AssessmentStatus::PaymentPending, $assessment->refresh()->status);
    }

    public function test_payment_status_marks_paid_after_qpay_verification(): void
    {
        $this->fakeQPay(paid: true);
        $assessment = $this->createAssessment();
        $this->postJson("/api/assessments/{$assessment->public_token}/payment");

        $this->getJson("/api/assessments/{$assessment->public_token}/payment-status")
            ->assertOk()
            ->assertJsonPath('status', 'paid');

        $assessment->refresh();
        $this->assertSame(AssessmentStatus::Paid, $assessment->status);
        $this->assertNotNull($assessment->paid_at);
        $this->assertSame(PaymentStatus::Paid, Payment::firstOrFail()->status);
        Http::assertSent(fn (Request $request) => $request->url() === 'https://qpay.test/v2/payment/pay_1');
    }

    public function test_underpayment_is_not_accepted(): void
    {
        $this->fakeQPay(paid: true, paidAmount: 100);
        $assessment = $this->createAssessment();
        $this->postJson("/api/assessments/{$assessment->public_token}/payment");

        $this->getJson("/api/assessments/{$assessment->public_token}/payment-status")->assertJsonPath('status', 'pending');
        $this->assertSame(AssessmentStatus::PaymentPending, $assessment->refresh()->status);
    }

    public function test_callback_triggers_independent_verification(): void
    {
        $this->fakeQPay(paid: true);
        $assessment = $this->createAssessment();
        $this->postJson("/api/assessments/{$assessment->public_token}/payment");
        $reference = Payment::firstOrFail()->reference;

        $this->get("/api/payments/qpay/callback/{$reference}")->assertOk()->assertSee('SUCCESS');

        $this->assertSame(AssessmentStatus::Paid, $assessment->refresh()->status);
    }

    public function test_callback_for_unknown_reference_changes_nothing(): void
    {
        Http::fake();

        $this->post('/api/payments/qpay/callback/SC'.str_repeat('A', 24))->assertOk();
        Http::assertNothingSent();
    }

    public function test_dev_bypass_marks_paid_outside_production(): void
    {
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/dev/mark-paid")
            ->assertOk()
            ->assertJsonPath('status', 'paid');

        $this->assertSame(AssessmentStatus::Paid, $assessment->refresh()->status);
        $this->assertSame('dev_bypass', Payment::firstOrFail()->provider);
    }

    public function test_dev_bypass_is_off_in_production_by_default(): void
    {
        $this->app['env'] = 'production';
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/dev/mark-paid")->assertNotFound();

        $this->assertSame(AssessmentStatus::Created, $assessment->refresh()->status);
    }

    public function test_dev_bypass_works_in_production_only_with_explicit_opt_in(): void
    {
        $this->app['env'] = 'production';
        config(['soulmate.payment_bypass_in_production' => true]);
        $this->fakeQPay();
        $assessment = $this->createAssessment();

        // The payment page learns it may show the test button…
        $this->postJson("/api/assessments/{$assessment->public_token}/payment")->assertJsonPath('dev_bypass', true);

        // …and the button works.
        $this->postJson("/api/assessments/{$assessment->public_token}/dev/mark-paid")->assertJsonPath('status', 'paid');
        $this->assertSame(AssessmentStatus::Paid, $assessment->refresh()->status);
    }

    public function test_production_opt_in_alone_does_not_enable_bypass(): void
    {
        $this->app['env'] = 'production';
        config(['soulmate.payment_bypass' => false, 'soulmate.payment_bypass_in_production' => true]);
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/dev/mark-paid")->assertNotFound();
    }

    public function test_fake_gateway_is_used_without_qpay_credentials_in_development(): void
    {
        Http::fake();
        config(['services.qpay.username' => null]);
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/payment")
            ->assertOk()
            ->assertJsonPath('dev_bypass', true)
            ->assertJsonPath('invoice.qr_text', 'SOULMATE-CHECK-DEV-'.Payment::firstOrFail()->reference);

        Http::assertNothingSent();
    }

    public function test_missing_qpay_config_in_production_is_an_error_not_a_bypass(): void
    {
        $this->app['env'] = 'production';
        config(['services.qpay.username' => null]);
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/payment")
            ->assertStatus(503)
            ->assertJsonPath('code', 'payment_provider_unavailable');
    }
}

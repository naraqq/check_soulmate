<?php

namespace App\Services;

use App\Exceptions\PaymentProviderException;
use App\Models\Payment;
use App\Services\Payments\InvoiceData;
use App\Services\Payments\PaymentCheckResult;
use App\Services\Payments\PaymentGateway;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * QPay merchant API v2 (https://developer.qpay.mn).
 *
 * Endpoints used — verify these against the documentation QPay gives you with
 * your merchant account before going live:
 *
 *   POST /auth/token        Basic auth (username:password) → access_token
 *   POST /invoice           create invoice → invoice_id, qr_text, qr_image, urls[]
 *   POST /payment/check     { object_type: "INVOICE", object_id } → rows[]
 *   GET  /payment/{id}      single payment → payment_status, payment_amount
 */
class QPayService implements PaymentGateway
{
    private const TOKEN_CACHE_KEY = 'qpay.access_token';

    public function name(): string
    {
        return 'qpay';
    }

    // -- Authentication ---------------------------------------------------------

    public function accessToken(bool $fresh = false): string
    {
        if ($fresh) {
            Cache::forget(self::TOKEN_CACHE_KEY);
        }

        $cached = Cache::get(self::TOKEN_CACHE_KEY);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $this->assertConfigured();

        $response = $this->send(fn () => Http::baseUrl($this->baseUrl())
            ->timeout($this->timeout())
            ->acceptJson()
            ->withBasicAuth((string) config('services.qpay.username'), (string) config('services.qpay.password'))
            ->post('/auth/token'));

        $token = $response->json('access_token');
        if (! is_string($token) || $token === '') {
            throw new PaymentProviderException('QPay auth response did not contain an access token.');
        }

        Cache::put(self::TOKEN_CACHE_KEY, $token, $this->tokenTtl($response->json('expires_in')));

        return $token;
    }

    // -- Invoices -----------------------------------------------------------------

    public function createInvoice(Payment $payment, string $description): InvoiceData
    {
        $response = $this->authorized(fn (PendingRequest $http) => $http->post('/invoice', [
            'invoice_code' => config('services.qpay.invoice_code'),
            'sender_invoice_no' => $payment->reference,
            'invoice_receiver_code' => config('services.qpay.invoice_receiver_code'),
            'invoice_description' => $description,
            'amount' => $payment->amount,
            'callback_url' => $this->callbackUrl($payment),
        ]));

        $invoiceId = $response->json('invoice_id');
        $qrText = $response->json('qr_text');

        if (! is_string($invoiceId) || ! is_string($qrText)) {
            throw new PaymentProviderException('QPay invoice response was missing invoice_id or qr_text.');
        }

        $deeplinks = collect($response->json('urls') ?? [])
            ->filter(fn ($url) => is_array($url) && isset($url['link']) && is_string($url['link']))
            ->map(fn (array $url) => [
                'name' => (string) ($url['name'] ?? ''),
                'description' => $url['description'] ?? null,
                'logo' => $url['logo'] ?? null,
                'link' => $url['link'],
            ])
            ->values()
            ->all();

        return new InvoiceData(
            invoiceId: $invoiceId,
            qrText: $qrText,
            qrImage: $response->json('qr_image'),
            shortUrl: $response->json('qPay_shortUrl'),
            deeplinks: $deeplinks,
            raw: $response->json() ?? [],
        );
    }

    // -- Payment checking & verification -----------------------------------------

    public function checkPayment(Payment $payment): PaymentCheckResult
    {
        if ($payment->provider_invoice_id === null) {
            return PaymentCheckResult::unpaid();
        }

        $response = $this->authorized(fn (PendingRequest $http) => $http->post('/payment/check', [
            'object_type' => 'INVOICE',
            'object_id' => $payment->provider_invoice_id,
            'offset' => ['page_number' => 1, 'page_limit' => 100],
        ]));

        $paidRows = collect($response->json('rows') ?? [])
            ->filter(fn ($row) => is_array($row) && ($row['payment_status'] ?? null) === 'PAID');

        $paidAmount = (int) round((float) $paidRows->sum(fn (array $row) => (float) ($row['payment_amount'] ?? 0)));

        if ($paidRows->isEmpty() || $paidAmount < $payment->amount) {
            return PaymentCheckResult::unpaid(['check' => $response->json()]);
        }

        $paymentId = (string) $paidRows->first()['payment_id'];

        return $this->verifyPayment($payment, $paymentId, ['check' => $response->json()]);
    }

    /**
     * Independently fetch a payment by id and confirm it is PAID, belongs to
     * this invoice and covers the expected amount.
     */
    public function verifyPayment(Payment $payment, string $providerPaymentId, array $context = []): PaymentCheckResult
    {
        $response = $this->authorized(fn (PendingRequest $http) => $http->get('/payment/'.rawurlencode($providerPaymentId)));

        $status = $response->json('payment_status');
        $amount = (int) round((float) $response->json('payment_amount', 0));
        $objectId = $response->json('object_id');

        $matchesInvoice = $objectId === null || (string) $objectId === $payment->provider_invoice_id;
        $raw = $context + ['payment' => $response->json()];

        if ($status !== 'PAID' || ! $matchesInvoice || $amount < $payment->amount) {
            Log::warning('QPay payment could not be verified.', [
                'payment_reference' => $payment->reference,
                'status' => $status,
                'matches_invoice' => $matchesInvoice,
            ]);

            return PaymentCheckResult::unpaid($raw);
        }

        return new PaymentCheckResult(true, $amount, $providerPaymentId, $raw);
    }

    // -- Internals ----------------------------------------------------------------

    /**
     * Run a request with a bearer token, refreshing the token once on 401.
     *
     * @param  callable(PendingRequest): Response  $request
     */
    private function authorized(callable $request): Response
    {
        $make = fn (bool $fresh) => Http::baseUrl($this->baseUrl())
            ->timeout($this->timeout())
            ->acceptJson()
            ->withToken($this->accessToken($fresh));

        $response = $this->send(fn () => $request($make(false)), allowUnauthorized: true);

        if ($response->status() === 401) {
            $response = $this->send(fn () => $request($make(true)));
        }

        return $response;
    }

    /** @param  callable(): Response  $call */
    private function send(callable $call, bool $allowUnauthorized = false): Response
    {
        try {
            $response = $call();
        } catch (ConnectionException $e) {
            throw new PaymentProviderException('Could not connect to QPay.', previous: $e);
        }

        if ($response->successful() || ($allowUnauthorized && $response->status() === 401)) {
            return $response;
        }

        // Log status and QPay's error code only — never the full request.
        Log::error('QPay request failed.', [
            'status' => $response->status(),
            'error' => $response->json('error') ?? $response->json('message'),
        ]);

        throw new PaymentProviderException("QPay request failed with HTTP {$response->status()}.");
    }

    private function assertConfigured(): void
    {
        foreach (['username', 'password', 'invoice_code', 'callback_url'] as $key) {
            if (blank(config("services.qpay.{$key}"))) {
                throw new PaymentProviderException("QPay is not configured (missing services.qpay.{$key}).");
            }
        }
    }

    private function callbackUrl(Payment $payment): string
    {
        return rtrim((string) config('services.qpay.callback_url'), '/').'/'.$payment->reference;
    }

    /** QPay's expires_in may be a Unix timestamp or a number of seconds; handle both. */
    private function tokenTtl(mixed $expiresIn): int
    {
        $expiresIn = is_numeric($expiresIn) ? (int) $expiresIn : 0;
        $seconds = $expiresIn > 1_000_000_000 ? $expiresIn - time() : $expiresIn;

        // Refresh a minute early; fall back to 30 minutes when unknown.
        return $seconds > 120 ? $seconds - 60 : 1800;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.qpay.base_url'), '/');
    }

    private function timeout(): int
    {
        return (int) config('services.qpay.timeout', 20);
    }
}

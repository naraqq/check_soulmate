<?php

namespace App\Console\Commands;

use App\Support\PaymentBypass;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Throwable;

/** Read-only configuration/schema checks. Never prints credentials or calls a provider. */
class ProductionCheck extends Command
{
    protected $signature = 'app:production-check';

    protected $description = 'Check production configuration without exposing secrets or charging a payment';

    public function handle(): int
    {
        $https = static fn ($url) => is_string($url) && filter_var($url, FILTER_VALIDATE_URL)
            && parse_url($url, PHP_URL_SCHEME) === 'https';
        $provider = config('services.ai.provider');
        $checks = [
            'Production environment' => app()->environment('production'),
            'Debug output disabled' => config('app.debug') === false,
            'Encryption key configured' => filled(config('app.key')),
            'Public app URL uses HTTPS' => $https(config('app.url')),
            'Frontend URL uses HTTPS' => $https(config('soulmate.frontend_url')),
            'Test payment bypass disabled' => ! PaymentBypass::enabled(),
            'Positive report price' => (int) config('soulmate.price') > 0,
            'Supported AI provider configured' => in_array($provider, ['openai', 'gemini'], true),
            'AI credentials and model configured' => in_array($provider, ['openai', 'gemini'], true)
                && filled(config("services.{$provider}.api_key")) && filled(config("services.{$provider}.model")),
            'QPay merchant credentials configured' => filled(config('services.qpay.username'))
                && filled(config('services.qpay.password')) && filled(config('services.qpay.invoice_code')),
            'QPay production endpoint configured' => rtrim((string) config('services.qpay.base_url'), '/') === 'https://merchant.qpay.mn/v2',
            'QPay callback uses HTTPS' => $https(config('services.qpay.callback_url')),
            'Database queue enabled' => config('queue.default') === 'database',
            'Queue retry interval exceeds worker timeout' => (int) config('queue.connections.database.retry_after') > 420,
            'Exported questionnaire exists' => is_file(config('soulmate.questionnaire_path')),
        ];
        try {
            $checks['Check-in and feedback migration applied'] = Schema::hasColumns('assessments', ['previous_assessment_id', 'feedback_json', 'feedback_submitted_at']);
        } catch (Throwable) {
            $checks['Check-in and feedback migration applied'] = false;
        }
        foreach ($checks as $label => $passed) {
            $this->line(($passed ? 'PASS' : 'FAIL').': '.$label);
        }
        $this->line('These checks do not verify live payments, AI response quality, TLS availability or queue-worker health.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}

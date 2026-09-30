<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ProductionCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_checks_production_without_printing_credentials(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.debug' => false,
            'app.url' => 'https://app.test',
            'soulmate.frontend_url' => 'https://app.test',
            'services.qpay.base_url' => 'https://merchant.qpay.mn/v2',
            'queue.default' => 'database',
            'queue.connections.database.retry_after' => 480,
        ]);
        $this->assertSame(0, Artisan::call('app:production-check'));
        $output = Artisan::output();
        $this->assertStringNotContainsString('test-openai-key', $output);
        $this->assertStringNotContainsString('TEST_MERCHANT', $output);
        config(['queue.connections.database.retry_after' => 90, 'app.debug' => true]);
        $this->assertSame(1, Artisan::call('app:production-check'));
        $output = Artisan::output();
        $this->assertStringContainsString('FAIL: Debug output disabled', $output);
        $this->assertStringContainsString('FAIL: Queue retry interval', $output);
    }

    public function test_missing_credentials_and_http_callback_fail(): void
    {
        config(['services.openai.api_key' => '', 'services.qpay.callback_url' => 'http://app.test/callback']);
        $this->assertSame(1, Artisan::call('app:production-check'));
        $output = Artisan::output();
        $this->assertStringContainsString('FAIL: AI credentials', $output);
        $this->assertStringContainsString('FAIL: QPay callback', $output);
    }
}

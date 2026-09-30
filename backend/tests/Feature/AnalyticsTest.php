<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    private const PHONE_FB = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]';

    private const VISITOR = 'a1b2c3d4e5f6a7b8c9d0e1f2';

    private function attribution(array $overrides = []): array
    {
        return array_merge([
            'visitor_id' => self::VISITOR,
            'source' => 'Facebook',
            'medium' => 'paid_social',
            'campaign' => 'oct-launch<script>',
            'referrer' => 'l.facebook.com',
        ], $overrides);
    }

    private function sendEvent(array $body, string $userAgent = self::PHONE_FB)
    {
        return $this->withHeader('User-Agent', $userAgent)->postJson('/api/events', $body);
    }

    public function test_records_client_event_with_clean_attribution_and_device(): void
    {
        $this->sendEvent(['name' => 'question_answered', 'question' => 'int_initiates', 'track' => 'early', 'attribution' => $this->attribution()])
            ->assertNoContent();

        $event = DB::table('analytics_events')->sole();
        $this->assertSame('question_answered', $event->name);
        $this->assertSame(self::VISITOR, $event->visitor_id);
        $this->assertSame('facebook', $event->source);
        $this->assertSame('oct-launchscript', $event->campaign);
        $this->assertSame('mobile', $event->device);
        $this->assertSame('facebook', $event->in_app);
        $this->assertSame('int_initiates', $event->step);
        $this->assertSame('early', $event->track);
    }

    public function test_rejects_unknown_and_server_only_events(): void
    {
        $this->sendEvent(['name' => 'hacked'])->assertUnprocessable();
        // Revenue can only come from verified payments, never from the browser.
        $this->sendEvent(['name' => 'payment_confirmed'])->assertUnprocessable();
        $this->assertDatabaseCount('analytics_events', 0);
    }

    public function test_bots_are_ignored(): void
    {
        $this->sendEvent(['name' => 'landing_viewed'], 'Mozilla/5.0 (compatible; Googlebot/2.1)')->assertNoContent();
        $this->assertDatabaseCount('analytics_events', 0);
    }

    public function test_checkout_records_segment_and_attribution_but_never_exposes_it(): void
    {
        $response = $this->withHeader('User-Agent', self::PHONE_FB)
            ->postJson('/api/assessments', $this->submitPayload([
                'answers' => $this->validAnswers('talking'),
                'attribution' => $this->attribution(),
            ]))
            ->assertCreated();

        $this->assertArrayNotHasKey('analytics_json', $response->json());
        $event = DB::table('analytics_events')->where('name', 'checkout_started')->sole();
        $this->assertSame('facebook', $event->source);
        $this->assertSame('early', $event->track);
        $this->assertSame('talking', $event->stage);
        $this->assertSame('female', $event->gender);
    }

    public function test_verified_payment_is_recorded_once_with_revenue(): void
    {
        $this->fakeQPay(paid: true);
        $token = $this->withHeader('User-Agent', self::PHONE_FB)
            ->postJson('/api/assessments', $this->submitPayload(['attribution' => $this->attribution()]))
            ->json('token');
        $this->postJson("/api/assessments/{$token}/payment");

        $this->getJson("/api/assessments/{$token}/payment-status")->assertJsonPath('status', 'paid');
        $this->getJson("/api/assessments/{$token}/payment-status")->assertJsonPath('status', 'paid');

        $payment = DB::table('analytics_events')->where('name', 'payment_confirmed')->sole();
        $this->assertSame(7900, (int) $payment->amount);
        $this->assertSame('facebook', $payment->source);
        $this->assertSame(self::VISITOR, $payment->visitor_id);
    }

    public function test_test_unlocks_are_not_revenue(): void
    {
        $assessment = $this->createAssessment();

        $this->postJson("/api/assessments/{$assessment->public_token}/dev/mark-paid")->assertOk();

        $this->assertDatabaseHas('analytics_events', ['name' => 'test_unlock', 'amount' => null]);
        $this->assertDatabaseMissing('analytics_events', ['name' => 'payment_confirmed']);
    }

    public function test_dashboard_is_hidden_without_a_key_and_locked_with_one(): void
    {
        config(['soulmate.analytics_key' => '']);
        $this->getJson('/api/admin/analytics')->assertNotFound();

        config(['soulmate.analytics_key' => 'correct-horse-battery-staple']);
        $this->getJson('/api/admin/analytics')->assertUnauthorized();
        $this->withToken('wrong')->getJson('/api/admin/analytics')->assertUnauthorized();
    }

    public function test_dashboard_reports_funnel_channels_audience_and_question_reach(): void
    {
        config(['soulmate.analytics_key' => 'correct-horse-battery-staple']);
        $this->fakeQPay(paid: true);

        // A paying visitor from a Facebook campaign…
        foreach (['landing_viewed', 'check_started', 'check_completed'] as $name) {
            $this->sendEvent(['name' => $name, 'attribution' => $this->attribution()]);
        }
        $this->sendEvent(['name' => 'question_answered', 'question' => 'comm_heard', 'track' => 'couple', 'attribution' => $this->attribution()]);
        $token = $this->withHeader('User-Agent', self::PHONE_FB)
            ->postJson('/api/assessments', $this->submitPayload(['attribution' => $this->attribution()]))
            ->json('token');
        $this->postJson("/api/assessments/{$token}/payment");
        $this->getJson("/api/assessments/{$token}/payment-status");

        // …and a direct visitor who only looked at the landing page.
        $this->sendEvent(['name' => 'landing_viewed', 'attribution' => ['visitor_id' => 'ffffffffffffffffffffffff']], 'Mozilla/5.0 (Windows NT 10.0) Chrome/130');

        $data = $this->withToken('correct-horse-battery-staple')->getJson('/api/admin/analytics?days=7')->assertOk()->json();

        $this->assertSame(2, $data['kpis']['visitors']);
        $this->assertSame(1, $data['kpis']['paid']);
        $this->assertSame(7900, $data['kpis']['revenue']);
        $this->assertEquals(0.5, $data['kpis']['conversion']);
        $this->assertCount(7, $data['daily']);

        $facebook = collect($data['channels'])->firstWhere('source', 'facebook');
        $this->assertSame(['visitors' => 1, 'paid' => 1, 'revenue' => 7900], array_intersect_key($facebook, array_flip(['visitors', 'paid', 'revenue'])));
        $this->assertSame(0, collect($data['channels'])->firstWhere('source', 'direct')['paid']);

        $this->assertSame('exclusive', $data['audience']['stage'][0]['value']);
        $this->assertSame(1, collect($data['devices'])->firstWhere('in_app', 'facebook')['paid']);
        $this->assertSame([['track' => 'couple', 'question' => 'comm_heard', 'visitors' => 1]], $data['questions']);
    }

    public function test_dashboard_credits_visitors_and_sales_to_shares(): void
    {
        config(['soulmate.analytics_key' => 'k']);
        $this->fakeQPay(paid: true);

        // Someone shares their card to an Instagram story…
        $this->sendEvent(['name' => 'share_opened', 'detail' => 'teaser', 'attribution' => $this->attribution()]);
        $this->sendEvent(['name' => 'share_completed', 'detail' => 'instagram_story', 'attribution' => $this->attribution()]);

        // …and a friend arrives through that story and pays.
        $friend = ['visitor_id' => 'bbbbbbbbbbbbbbbbbbbbbbbb', 'source' => 'share', 'medium' => 'instagram_story', 'campaign' => 'teaser'];
        $this->sendEvent(['name' => 'landing_viewed', 'attribution' => $friend]);
        $token = $this->withHeader('User-Agent', self::PHONE_FB)
            ->postJson('/api/assessments', $this->submitPayload(['attribution' => $friend]))
            ->json('token');
        $this->postJson("/api/assessments/{$token}/payment");
        $this->getJson("/api/assessments/{$token}/payment-status");

        $sharing = $this->withToken('k')->getJson('/api/admin/analytics?days=7')->json('sharing');

        $this->assertSame(1, $sharing['sharers']);
        $this->assertSame([['method' => 'instagram_story', 'shares' => 1, 'visitors' => 1]], $sharing['by_method']);
        $this->assertSame(1, $sharing['visitors']);
        $this->assertSame(1, $sharing['paid']);
        $this->assertSame(7900, $sharing['revenue']);
    }

    public function test_share_detail_must_be_a_simple_code(): void
    {
        $this->sendEvent(['name' => 'share_completed', 'detail' => '<script>'])->assertUnprocessable();
    }

    public function test_invalid_range_is_rejected(): void
    {
        config(['soulmate.analytics_key' => 'k']);
        $this->withToken('k')->getJson('/api/admin/analytics?days=3')->assertUnprocessable();
    }
}

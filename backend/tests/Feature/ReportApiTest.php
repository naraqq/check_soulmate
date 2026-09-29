<?php

namespace Tests\Feature;

use App\Enums\AssessmentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    public function test_generate_requires_confirmed_payment(): void
    {
        Http::fake();
        $assessment = $this->createAssessment(AssessmentStatus::PaymentPending);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")
            ->assertForbidden()
            ->assertJsonPath('code', 'payment_required');

        Http::assertNothingSent();
    }

    public function test_report_endpoint_requires_payment(): void
    {
        $assessment = $this->createAssessment();

        $this->getJson("/api/assessments/{$assessment->public_token}/report")->assertForbidden();
    }

    public function test_report_endpoint_reports_pending_state_before_generation(): void
    {
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->getJson("/api/assessments/{$assessment->public_token}/report")
            ->assertStatus(202)
            ->assertJsonPath('status', 'paid');
    }

    public function test_generates_stores_and_returns_report_once(): void
    {
        Http::fake(['api.openai.com/*' => Http::response($this->openAiResponse($this->fakeReport()))]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('report.headline', 'Та хоёрын харилцаанд дулаан суурь байна.');

        $this->assertSame(AssessmentStatus::Completed, $assessment->refresh()->status);
        $this->assertDatabaseCount('reports', 1);

        // Refreshing / re-requesting must not call OpenAI again.
        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")->assertOk();
        $this->getJson("/api/assessments/{$assessment->public_token}/report")
            ->assertOk()
            ->assertJsonPath('report.communication.observations.0', 'Ажиглалт нэг.');

        Http::assertSentCount(1);
    }

    public function test_openai_request_is_structured_and_minimal(): void
    {
        Http::fake(['api.openai.com/*' => Http::response($this->openAiResponse($this->fakeReport()))]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")->assertOk();

        Http::assertSent(function (Request $request) use ($assessment) {
            $body = $request->data();
            $userMessage = $body['messages'][1]['content'];

            return $request->url() === 'https://api.openai.com/v1/chat/completions'
                && $request->hasHeader('Authorization', 'Bearer test-openai-key')
                && $body['model'] === 'test-model'
                && $body['store'] === false
                && $body['response_format']['json_schema']['strict'] === true
                && str_contains($userMessage, 'Ихэвчлэн би') // answers sent as trusted label text
                && ! str_contains($userMessage, $assessment->public_token);
        });
    }

    public function test_invalid_ai_json_marks_failed_and_allows_retry(): void
    {
        Http::fakeSequence('api.openai.com/*')
            ->push($this->openAiResponse('{"headline": "cut off'))
            ->push($this->openAiResponse($this->fakeReport()));

        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")
            ->assertStatus(409)
            ->assertJsonPath('code', 'report_generation_failed')
            ->assertJsonPath('can_retry', true);

        $assessment->refresh();
        $this->assertSame(AssessmentStatus::Failed, $assessment->status);
        $this->assertSame('invalid_ai_response', $assessment->failure_reason);
        $this->assertDatabaseCount('reports', 0);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")
            ->assertOk()
            ->assertJsonPath('status', 'completed');
    }

    public function test_schema_violating_ai_output_is_rejected(): void
    {
        $bad = $this->fakeReport();
        $bad['areas_to_explore'][0]['importance'] = 'critical';
        Http::fake(['api.openai.com/*' => Http::response($this->openAiResponse($bad))]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")->assertStatus(409);
        $this->assertDatabaseCount('reports', 0);
    }

    public function test_openai_outage_fails_gracefully(): void
    {
        Http::fake(['api.openai.com/*' => Http::response(['error' => ['message' => 'overloaded']], 503)]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")->assertStatus(409);
        $this->assertSame('openai_http_503', $assessment->refresh()->failure_reason);
    }

    public function test_generation_attempts_are_capped(): void
    {
        Http::fake(['api.openai.com/*' => Http::response(['error' => []], 500)]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);
        $url = "/api/assessments/{$assessment->public_token}/generate-report";

        for ($i = 0; $i < config('soulmate.max_generation_attempts'); $i++) {
            $this->postJson($url)->assertStatus(409);
        }

        $this->postJson($url)->assertStatus(429)->assertJsonPath('code', 'generation_limit_reached');
    }

    public function test_in_progress_generation_is_not_started_twice(): void
    {
        Http::fake();
        $assessment = $this->createAssessment(AssessmentStatus::Paid);
        $assessment->forceFill(['status' => AssessmentStatus::Generating, 'generation_started_at' => now()])->save();

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")
            ->assertStatus(202)
            ->assertJsonPath('status', 'generating');

        Http::assertNothingSent();
    }
}

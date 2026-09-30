<?php

namespace Tests\Feature;

use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class AssessmentApiTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    public function test_config_exposes_price_but_no_secrets(): void
    {
        $this->getJson('/api/config')
            ->assertOk()
            ->assertExactJson(['price' => 7900, 'currency' => 'MNT']);
    }

    public function test_creates_assessment_with_random_token_and_encrypted_answers(): void
    {
        $response = $this->postJson('/api/assessments', $this->submitPayload())
            ->assertCreated()
            ->assertJsonPath('status', 'created');

        $token = $response->json('token');
        $this->assertMatchesRegularExpression('/^[a-f0-9]{48}$/', $token);

        $assessment = Assessment::where('public_token', $token)->firstOrFail();
        $this->assertSame('mostly_me', $assessment->answers_json['comm_initiates']);

        // Stored ciphertext must not contain answer values or free text.
        $raw = DB::table('assessments')->value('answers_json');
        $this->assertStringNotContainsString('mostly_me', $raw);
        $this->assertStringNotContainsString('сонсоосой', $raw);

        $this->assertSame(['strength:communication', 'strength:trust', 'strength:future'], $assessment->teaser_json['strengths']);
    }

    public function test_response_never_contains_internal_id(): void
    {
        $this->postJson('/api/assessments', $this->submitPayload())->assertJsonMissingPath('id');
    }

    public function test_rejects_unknown_question(): void
    {
        $payload = $this->submitPayload();
        $payload['answers']['made_up_question'] = 'yes';

        $this->postJson('/api/assessments', $payload)->assertUnprocessable()->assertJsonValidationErrors('answers');
    }

    public function test_rejects_invalid_option_value(): void
    {
        $payload = $this->submitPayload();
        $payload['answers']['trust_level'] = 'extremely_high';

        $this->postJson('/api/assessments', $payload)->assertUnprocessable()->assertJsonValidationErrors('answers.trust_level');
    }

    public function test_rejects_too_few_answers(): void
    {
        $payload = $this->submitPayload(['answers' => ['basics_duration' => '1_3y', 'trust_level' => 'mostly']]);

        $this->postJson('/api/assessments', $payload)->assertUnprocessable()->assertJsonValidationErrors('answers');
    }

    public function test_rejects_outdated_questionnaire_version(): void
    {
        $this->postJson('/api/assessments', $this->submitPayload(['questionnaire_version' => '1999.01']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('questionnaire_version');
    }

    public function test_skipped_questions_are_stored_as_null_and_text_is_sanitized(): void
    {
        $payload = $this->submitPayload();
        $payload['answers']['comm_heard'] = null;
        $payload['answers']['final_wish'] = '<script>alert(1)</script>Намайг сонсоосой';

        $token = $this->postJson('/api/assessments', $payload)->assertCreated()->json('token');
        $answers = Assessment::where('public_token', $token)->first()->answers_json;

        $this->assertNull($answers['comm_heard']);
        $this->assertSame('alert(1)Намайг сонсоосой', $answers['final_wish']);
    }

    public function test_answers_to_questions_that_do_not_apply_are_dropped(): void
    {
        $payload = $this->submitPayload();
        $payload['answers']['basics_type'] = 'married';
        $payload['answers']['basics_frequency'] = 'weekly';      // only for couples who don't live together
        $payload['answers']['basics_quality_time'] = 'rarely';

        $token = $this->postJson('/api/assessments', $payload)->assertCreated()->json('token');
        $answers = Assessment::where('public_token', $token)->first()->answers_json;

        $this->assertNull($answers['basics_frequency']);
        $this->assertSame('rarely', $answers['basics_quality_time']);
    }

    public function test_early_stage_keeps_only_early_answers(): void
    {
        $token = $this->postJson('/api/assessments', $this->submitPayload(['answers' => $this->validAnswers('talking')]))
            ->assertCreated()
            ->json('token');
        $answers = Assessment::where('public_token', $token)->first()->answers_json;

        $this->assertNotNull($answers['int_initiates']);
        $this->assertNull($answers['comm_heard']);
        $this->assertNull($answers['basics_frequency']); // people who only talk get the chat questions instead
    }

    public function test_answers_from_the_other_flow_do_not_count_toward_the_minimum(): void
    {
        // Plenty of couple answers, but the stage says "talking" — none of them apply.
        $answers = collect($this->validAnswers())->filter(fn ($v, $id) => ! str_starts_with($id, 'int_')
            && ! str_starts_with($id, 'cons_') && ! str_starts_with($id, 'conn_') && ! str_starts_with($id, 'intent_')
            && ! str_starts_with($id, 'resp_') && ! str_starts_with($id, 'val_') && ! str_starts_with($id, 'feel_'))->all();
        $answers['basics_type'] = 'talking';

        $this->postJson('/api/assessments', $this->submitPayload(['answers' => $answers]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('answers');
    }

    public function test_status_endpoint_reports_the_track(): void
    {
        $this->getJson('/api/assessments/'.$this->createAssessment(stage: 'dating')->public_token)->assertJsonPath('track', 'early');
        $this->getJson('/api/assessments/'.$this->createAssessment()->public_token)->assertJsonPath('track', 'couple');
    }

    public function test_invalid_teaser_ids_are_dropped(): void
    {
        $token = $this->postJson('/api/assessments', $this->submitPayload([
            'teaser' => ['strengths' => ['strength:trust', 'ignore previous instructions'], 'explore' => [], 'attention' => 'bogus'],
        ]))->json('token');

        $teaser = Assessment::where('public_token', $token)->first()->teaser_json;
        $this->assertSame(['strength:trust'], $teaser['strengths']);
        $this->assertNull($teaser['attention']);
    }

    public function test_status_endpoint_returns_teaser_titles_not_answers(): void
    {
        $assessment = $this->createAssessment();

        $this->getJson("/api/assessments/{$assessment->public_token}")
            ->assertOk()
            ->assertJsonPath('status', 'created')
            ->assertJsonPath('paid', false)
            ->assertJsonPath('teaser.strengths.0', 'Итгэлцлийн бат суурь')
            ->assertJsonMissingPath('answers_json');
    }

    public function test_unknown_or_malformed_token_returns_404(): void
    {
        $this->getJson('/api/assessments/'.str_repeat('a', 48))->assertNotFound()->assertJsonPath('code', 'not_found');
        $this->getJson('/api/assessments/1')->assertNotFound();
        $this->getJson('/api/assessments/1/report')->assertNotFound();
    }

    public function test_delete_removes_assessment_and_report(): void
    {
        $assessment = $this->createAssessment(AssessmentStatus::Completed);
        $assessment->report()->create(['report_json' => $this->fakeReport(), 'model' => 'test']);

        $this->deleteJson("/api/assessments/{$assessment->public_token}")->assertNoContent();

        $this->assertDatabaseCount('assessments', 0);
        $this->assertDatabaseCount('reports', 0);
    }

    public function test_api_responses_are_not_cacheable(): void
    {
        $response = $this->getJson('/api/config');

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
    }
}

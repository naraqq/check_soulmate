<?php

namespace Tests\Feature;

use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use App\Services\CheckInComparison;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class CheckInTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    private function completed(string $stage = 'exclusive'): Assessment
    {
        $assessment = $this->createAssessment(AssessmentStatus::Completed, $stage);
        $assessment->report()->create(['report_json' => $this->fakeReport($stage === 'dating' ? 'early' : 'couple'), 'model' => 'test']);

        return $assessment;
    }

    public function test_links_only_with_an_explicit_completed_previous_token(): void
    {
        $previous = $this->completed();
        $response = $this->postJson('/api/assessments', $this->submitPayload(['previous_assessment_token' => $previous->public_token]))->assertCreated();
        $current = Assessment::where('public_token', $response->json('token'))->firstOrFail();
        $this->assertSame($previous->id, $current->previous_assessment_id);
        $response->assertJsonMissingPath('previous_assessment_id')->assertJsonMissingPath('previous_assessment_token');

        $fresh = $this->postJson('/api/assessments', $this->submitPayload())->assertCreated();
        $this->assertNull(Assessment::where('public_token', $fresh->json('token'))->firstOrFail()->previous_assessment_id);
    }

    public function test_rejects_missing_malformed_and_unfinished_previous_checks(): void
    {
        $unfinished = $this->createAssessment();
        foreach (['invalid', str_repeat('a', 48), $unfinished->public_token] as $token) {
            $this->postJson('/api/assessments', $this->submitPayload(['previous_assessment_token' => $token]))
                ->assertUnprocessable()->assertJsonValidationErrors('previous_assessment_token');
        }
    }

    public function test_compares_exact_anchors_across_stage_changes_and_reports_short_intervals(): void
    {
        $previous = $this->completed('dating');
        $previous->update(['answers_json' => array_merge($previous->answers_json, [
            'checkin_communication' => 'rarely', 'checkin_effort' => 'often', 'checkin_boundaries' => 'sometimes',
        ])]);
        $current = $this->completed();
        $current->update(['previous_assessment_id' => $previous->id, 'answers_json' => array_merge($current->answers_json, [
            'checkin_communication' => 'often', 'checkin_effort' => 'rarely', 'checkin_boundaries' => 'sometimes',
        ])]);
        $this->getJson("/api/assessments/{$current->public_token}/report")
            ->assertOk()->assertJsonPath('comparison.stage_changed', true)
            ->assertJsonPath('comparison.days_between', 0)
            ->assertJsonPath('comparison.items.0.direction', 'improved')
            ->assertJsonPath('comparison.items.1.direction', 'declined')
            ->assertJsonPath('comparison.items.2.direction', 'unchanged')
            ->assertJsonMissingPath('comparison.previous_assessment_token');
    }

    public function test_unknown_and_legacy_answers_do_not_become_improvements(): void
    {
        $previous = $this->completed();
        $answers = $previous->answers_json;
        unset($answers['checkin_communication']);
        $answers['checkin_effort'] = 'not_yet';
        $previous->update(['answers_json' => $answers]);
        $current = $this->completed();
        $current->update(['previous_assessment_id' => $previous->id]);
        $items = app(CheckInComparison::class)->forAssessment($current)['items'];
        $this->assertSame('not_comparable', $items[0]['direction']);
        $this->assertSame('not_comparable', $items[1]['direction']);
    }

    public function test_deleting_previous_check_removes_comparison_without_deleting_current(): void
    {
        $previous = $this->completed();
        $current = $this->completed();
        $current->update(['previous_assessment_id' => $previous->id]);
        $this->deleteJson("/api/assessments/{$previous->public_token}")->assertNoContent();
        $this->assertNull($current->refresh()->previous_assessment_id);
        $this->getJson("/api/assessments/{$current->public_token}/report")->assertOk()->assertJsonPath('comparison.status', 'baseline');
    }

    public function test_removed_feedback_endpoint_is_unavailable(): void
    {
        $assessment = $this->completed();
        $this->postJson("/api/assessments/{$assessment->public_token}/feedback", [
            'understood' => 'yes', 'actionable' => 'yes', 'concern' => 'none',
        ])->assertNotFound();
        $this->getJson("/api/assessments/{$assessment->public_token}/report")
            ->assertOk()->assertJsonMissingPath('feedback_submitted')->assertJsonMissingPath('feedback_json');
    }
}

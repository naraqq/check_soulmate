<?php

namespace Tests\Feature;

use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class PartnerShareTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    private function completed(): Assessment
    {
        $assessment = $this->createAssessment(AssessmentStatus::Completed);
        $report = $this->fakeReport();
        $report['strengths'][0]['evidence'] = [['answer' => 'PRIVATE ANSWER']];
        $assessment->report()->create(['report_json' => $report, 'model' => 'test']);

        return $assessment;
    }

    public function test_only_completed_paid_reports_can_be_shared(): void
    {
        foreach ([AssessmentStatus::Created, AssessmentStatus::PaymentPending, AssessmentStatus::Paid, AssessmentStatus::Generating, AssessmentStatus::Failed, AssessmentStatus::Completed] as $status) {
            $assessment = $this->createAssessment($status);
            $expected = $status->isPaid() ? 409 : 402;
            $this->postJson("/api/assessments/{$assessment->public_token}/partner-share", ['sections' => ['strengths']])->assertStatus($expected);
            $this->getJson("/api/assessments/{$assessment->public_token}/partner-share")->assertStatus($expected);
        }
    }

    public function test_public_link_returns_only_selected_sanitized_fields_and_cannot_manage_assessment(): void
    {
        $assessment = $this->completed();
        $url = "/api/assessments/{$assessment->public_token}/partner-share";
        $this->getJson($url)->assertOk()->assertExactJson(['share' => null]);
        $created = $this->postJson($url, ['sections' => ['strengths']])->assertCreated();
        $token = $created->json('share.token');
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $token);
        $content = ['strengths' => [['title' => 'Итгэлцэл', 'description' => 'Та хамтрагчдаа бүрэн итгэдэг.']]];
        $this->getJson("/api/shared-reports/$token")->assertOk()->assertExactJson(['content' => $content])->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        $this->getJson($url)->assertExactJson(['share' => ['token' => $token, 'content' => $content]]);
        $this->getJson("/api/assessments/$token/report")->assertNotFound();
        $this->deleteJson("/api/assessments/$token")->assertNotFound();
        $this->getJson("/api/shared-reports/{$assessment->public_token}")->assertNotFound();
        $stored = DB::table('partner_shares')->first();
        $this->assertNotSame($token, $stored->token);
        $this->assertStringNotContainsString('Итгэлцэл', $stored->content);
        $this->assertSame(hash('sha256', $token), $stored->token_hash);
    }

    public function test_rejects_private_unknown_empty_and_duplicate_selections(): void
    {
        $assessment = $this->completed();
        foreach ([[], ['note_to_you'], ['summary'], ['evidence'], ['strengths', 'strengths'], ['answers_json']] as $sections) {
            $this->postJson("/api/assessments/{$assessment->public_token}/partner-share", ['sections' => $sections])->assertUnprocessable();
        }
    }

    public function test_rotation_revocation_and_assessment_deletion_invalidate_links(): void
    {
        $assessment = $this->completed();
        $url = "/api/assessments/{$assessment->public_token}/partner-share";
        $first = $this->postJson($url, ['sections' => ['strengths']])->assertCreated()->json('share.token');
        $second = $this->postJson($url, ['sections' => ['conversation_starters', 'areas_to_explore']])->assertCreated()->json('share.token');
        $this->getJson("/api/shared-reports/$first")->assertNotFound();
        $this->getJson("/api/shared-reports/$second")->assertOk()->assertJsonMissingPath('content.strengths');
        $this->deleteJson($url)->assertNoContent();
        $this->getJson("/api/shared-reports/$second")->assertNotFound();
        $this->deleteJson($url)->assertNoContent();
        $third = $this->postJson($url, ['sections' => ['strengths']])->assertCreated()->json('share.token');
        $this->deleteJson("/api/assessments/{$assessment->public_token}")->assertNoContent();
        $this->getJson("/api/shared-reports/$third")->assertNotFound();
        $this->assertDatabaseCount('partner_shares', 0);
    }

    public function test_does_not_publish_after_parent_status_changes(): void
    {
        $assessment = $this->completed();
        $url = "/api/assessments/{$assessment->public_token}/partner-share";
        $token = $this->postJson($url, ['sections' => ['strengths']])->assertCreated()->json('share.token');
        $assessment->update(['status' => AssessmentStatus::Failed]);
        $this->getJson("/api/shared-reports/$token")->assertNotFound();
        $this->deleteJson($url)->assertNoContent();
    }
}

<?php

namespace Tests\Feature;

use App\Enums\AssessmentStatus;
use App\Services\RelationshipReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class GeminiReportTest extends TestCase
{
    use BuildsAssessments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.ai.provider' => 'gemini',
            'services.gemini.api_key' => 'test-gemini-key',
            'services.gemini.model' => 'gemini-test-model',
        ]);
    }

    private function geminiResponse(string $text, string $finish = 'STOP'): array
    {
        return ['candidates' => [[
            'finishReason' => $finish,
            'content' => ['role' => 'model', 'parts' => [['text' => $text]]],
        ]]];
    }

    public function test_generates_report_with_gemini(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response(
            $this->geminiResponse(json_encode($this->fakeReport(), JSON_UNESCAPED_UNICODE))
        )]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")
            ->assertOk()
            ->assertJsonPath('report.headline', 'Та хоёрын харилцаанд дулаан суурь байна.');

        $this->assertSame('gemini:gemini-test-model', $assessment->report->model);

        Http::assertSent(function (Request $request) {
            $body = $request->data();

            return $request->url() === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent'
                && $request->hasHeader('x-goog-api-key', 'test-gemini-key')
                && $body['generationConfig']['responseMimeType'] === 'application/json'
                && $body['generationConfig']['thinkingConfig']['thinkingBudget'] === 256
                && str_contains($body['systemInstruction']['parts'][0]['text'], 'Mongolian');
        });
    }

    public function test_truncated_gemini_output_fails_gracefully(): void
    {
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse('{"headline":', 'MAX_TOKENS'))]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")->assertStatus(409);
        $this->assertSame('gemini_truncated', $assessment->refresh()->failure_reason);
    }

    public function test_markdown_fenced_json_is_accepted(): void
    {
        $fenced = "```json\n".json_encode($this->fakeReport(), JSON_UNESCAPED_UNICODE)."\n```";
        Http::fake(['generativelanguage.googleapis.com/*' => Http::response($this->geminiResponse($fenced))]);
        $assessment = $this->createAssessment(AssessmentStatus::Paid);

        $this->postJson("/api/assessments/{$assessment->public_token}/generate-report")->assertOk();
    }

    public function test_gemini_schema_has_no_additional_properties_and_uppercase_types(): void
    {
        $schema = RelationshipReportService::geminiSchema(RelationshipReportService::jsonSchema());
        $json = json_encode($schema);

        $this->assertStringNotContainsString('additionalProperties', $json);
        $this->assertSame('OBJECT', $schema['type']);
        $this->assertSame('ARRAY', $schema['properties']['strengths']['type']);
        $this->assertSame(['low', 'moderate', 'high'], $schema['properties']['areas_to_explore']['items']['properties']['importance']['enum']);
    }
}

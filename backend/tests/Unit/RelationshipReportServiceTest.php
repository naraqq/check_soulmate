<?php

namespace Tests\Unit;

use App\Exceptions\ReportGenerationException;
use App\Models\Assessment;
use App\Services\Questionnaire;
use App\Services\RelationshipReportService;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class RelationshipReportServiceTest extends TestCase
{
    use BuildsAssessments;

    private function service(): RelationshipReportService
    {
        return app(RelationshipReportService::class);
    }

    public function test_follow_ups_require_both_stage_and_experience(): void
    {
        $questionnaire = app(Questionnaire::class);
        $question = collect($questionnaire->questions())->firstWhere('id', 'int_plans');
        $this->assertFalse($questionnaire->isVisible($question, ['basics_type' => 'dating']));
        $this->assertTrue($questionnaire->isVisible($question, ['basics_type' => 'dating', 'basics_met_in_person' => 'once']));
        $this->assertFalse($questionnaire->isVisible($question, ['basics_type' => 'married', 'basics_met_in_person' => 'once']));
    }

    public function test_hidden_repair_answers_are_removed_and_not_described(): void
    {
        $questionnaire = app(Questionnaire::class);
        $answers = $this->validAnswers();
        $answers['conflict_frequency'] = 'never';
        $answers['conflict_after'] = 'unresolved';
        $normalized = $questionnaire->normalizeAnswers($answers);
        $this->assertNull($normalized['conflict_after']);
        $described = $questionnaire->describe($answers);
        $repair = collect($questionnaire->questions())->firstWhere('id', 'conflict_after');
        $this->assertNotContains($repair['text'], array_column($described['categories']['conflict']['answers'], 'question'));
    }

    public function test_grounding_uses_exact_answer_labels_and_strips_internal_ids(): void
    {
        $answers = app(Questionnaire::class)->normalizeAnswers($this->validAnswers());
        $report = $this->fakeReport();
        $report['communication']['evidence_question_ids'] = ['comm_initiates'];
        $grounded = $this->service()->groundReport($report, $answers, 'couple');
        $this->assertSame('Ихэвчлэн би', $grounded['evidence'][0]['answer']);
        $this->assertSame($grounded['evidence'], $grounded['communication']['evidence']);
        $this->assertArrayNotHasKey('evidence_question_ids', $grounded);
    }

    public function test_grounding_rejects_hidden_and_invented_evidence(): void
    {
        $answers = app(Questionnaire::class)->normalizeAnswers($this->validAnswers());
        $report = $this->fakeReport();
        $report['evidence_question_ids'] = ['int_initiates'];
        $this->expectException(ReportGenerationException::class);
        $this->service()->groundReport($report, $answers, 'couple');
    }

    public function test_topic_cannot_cite_an_unrelated_topic(): void
    {
        $answers = app(Questionnaire::class)->normalizeAnswers($this->validAnswers());
        $report = $this->fakeReport();
        $report['trust']['evidence_question_ids'] = ['comm_initiates'];
        $this->expectException(ReportGenerationException::class);
        $this->service()->groundReport($report, $answers, 'couple');
    }

    public function test_any_topic_may_cite_what_the_user_said_about_themselves(): void
    {
        $answers = app(Questionnaire::class)->normalizeAnswers($this->validAnswers());
        $report = $this->fakeReport();
        $report['affection']['evidence_question_ids'] = ['aff_initiates', 'self_receives_love'];

        $grounded = $this->service()->groundReport($report, $answers, 'couple');

        $this->assertSame('Сайхан үг, талархал сонсох', $grounded['affection']['evidence'][1]['answer']);
    }

    public function test_answers_about_the_user_do_not_count_toward_the_minimum(): void
    {
        $answers = ['basics_type' => 'married'];
        foreach (app(Questionnaire::class)->questions() as $q) {
            if (in_array($q['category'], ['basics', 'self'], true) && $q['type'] !== 'text' && ! isset($answers[$q['id']])) {
                $answers[$q['id']] = $q['options'][0]['value'];
            }
        }

        $this->expectException(ValidationException::class);
        app(Questionnaire::class)->normalizeAnswers($answers);
    }

    public function test_prompts_explain_the_about_you_answers(): void
    {
        foreach (['couple', 'early'] as $track) {
            $prompt = $this->service()->systemPrompt($track);
            $this->assertStringContainsString('how they show love', $prompt);
            $this->assertStringContainsString('never if they chose not to say', $prompt);
        }
    }

    public function test_attention_requires_supporting_evidence_too(): void
    {
        $answers = app(Questionnaire::class)->normalizeAnswers($this->validAnswers());
        $report = $this->fakeReport();
        $report['trust']['state'] = 'attention';
        $report['trust']['evidence_question_ids'] = [];
        $this->expectException(ReportGenerationException::class);
        $this->service()->groundReport($report, $answers, 'couple');
    }

    public function test_report_requires_specific_uncertainty(): void
    {
        $report = $this->fakeReport();
        unset($report['communication']['uncertainty']);
        $this->expectException(ReportGenerationException::class);
        $this->service()->validateReport($report);
    }

    public function test_redacts_contact_details(): void
    {
        $text = $this->service()->redact('Над руу 99112233 эсвэл +976 8811-2233, test@mail.mn, https://fb.com/me бичээрэй');

        $this->assertStringNotContainsString('99112233', $text);
        $this->assertStringNotContainsString('8811', $text);
        $this->assertStringNotContainsString('test@mail.mn', $text);
        $this->assertStringNotContainsString('fb.com', $text);
        $this->assertStringContainsString('[утас]', $text);
    }

    public function test_validation_strips_unknown_fields_and_bounds_lists(): void
    {
        $report = $this->fakeReport();
        $report['diagnosis'] = 'should be removed';
        $report['conversation_starters'] = array_fill(0, 20, 'Асуулт?');

        $clean = $this->service()->validateReport($report);

        $this->assertArrayNotHasKey('diagnosis', $clean);
        $this->assertCount(8, $clean['conversation_starters']);
    }

    public function test_validation_rejects_missing_sections(): void
    {
        $report = $this->fakeReport();
        unset($report['trust']);

        $this->expectException(ReportGenerationException::class);
        $this->service()->validateReport($report);
    }

    public function test_schema_is_strict_and_lists_every_property_as_required(): void
    {
        $schema = RelationshipReportService::jsonSchema();

        $this->assertFalse($schema['additionalProperties']);
        $this->assertEqualsCanonicalizing(array_keys($schema['properties']), $schema['required']);
        $this->assertContains('future', $schema['required']);
    }

    public function test_system_prompt_requests_mongolian(): void
    {
        $this->assertStringContainsString('Mongolian', $this->service()->systemPrompt());
    }

    public function test_system_prompt_forbids_referring_to_answers_and_disclaimers(): void
    {
        $prompt = $this->service()->systemPrompt();

        $this->assertStringContainsString('NEVER mention the questionnaire', $prompt);
        $this->assertStringContainsString('Do not add disclaimers', $prompt);
        $this->assertStringContainsString('Do NOT mirror it back', $prompt);
    }

    public function test_system_prompt_supports_choice_and_evidence(): void
    {
        foreach (['early', 'couple'] as $track) {
            $prompt = $this->service()->systemPrompt($track);
            $this->assertStringContainsString('Staying together is not the default', $prompt);
            $this->assertStringContainsString('Unknown, skipped, not discussed and too early', $prompt);
            $this->assertStringContainsString('prioritize safety', $prompt);
        }
    }

    public function test_early_prompt_allows_an_honest_not_the_right_fit(): void
    {
        $prompt = $this->service()->systemPrompt('early');

        $this->assertStringContainsString('may not be the right fit', $prompt);
        $this->assertStringContainsString('never "хамтрагч тань"', $prompt);
        $this->assertStringContainsString('NEVER mention the questionnaire', $prompt);
        $this->assertStringContainsString('Never predict cheating', $prompt);
        // The "never suggest separating" rule stays for committed couples only.
        $this->assertStringNotContainsString('NEVER encourage or suggest separating', $prompt);
    }

    public function test_early_schema_has_potential_read_and_early_topics_only(): void
    {
        $schema = RelationshipReportService::jsonSchema('early');

        $this->assertEqualsCanonicalizing(array_keys($schema['properties']), $schema['required']);
        $this->assertSame(RelationshipReportService::POTENTIAL_LEVELS, $schema['properties']['potential']['properties']['level']['enum']);
        foreach (RelationshipReportService::EARLY_SECTIONS as $section) {
            $this->assertContains($section, $schema['required']);
        }
        $this->assertNotContains('communication', $schema['required']);
        $this->assertNotContains('potential', RelationshipReportService::jsonSchema()['required']);
    }

    public function test_early_validation_rejects_unknown_potential_level(): void
    {
        $report = $this->fakeReport('early');
        $report['potential']['level'] = 'soulmates';

        $this->expectException(ReportGenerationException::class);
        $this->service()->validateReport($report, 'early');
    }

    public function test_payload_includes_gender_and_age_context(): void
    {
        $assessment = new Assessment([
            'answers_json' => app(Questionnaire::class)->normalizeAnswers($this->validAnswers()),
            'teaser_json' => null,
        ]);

        $context = collect($this->service()->buildPayload($assessment)['about_user_and_relationship']);

        $this->assertContains('Таны хүйс?', $context->pluck('question'));
        $this->assertContains('Таны нас?', $context->pluck('question'));
        $this->assertContains('Эмэгтэй', $context->pluck('answer'));
    }
}

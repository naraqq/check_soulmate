<?php

namespace Tests\Unit;

use App\Exceptions\ReportGenerationException;
use App\Services\RelationshipReportService;
use Tests\Concerns\BuildsAssessments;
use Tests\TestCase;

class RelationshipReportServiceTest extends TestCase
{
    use BuildsAssessments;

    private function service(): RelationshipReportService
    {
        return app(RelationshipReportService::class);
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
}

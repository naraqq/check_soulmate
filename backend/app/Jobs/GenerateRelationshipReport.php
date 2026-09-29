<?php

namespace App\Jobs;

use App\Enums\AssessmentStatus;
use App\Exceptions\ReportGenerationException;
use App\Models\Assessment;
use App\Services\RelationshipReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Generates the AI report for a paid assessment. The controller has already
 * atomically claimed the assessment (status → generating), so only one job
 * runs per attempt. Failures are recorded, never retried automatically.
 */
class GenerateRelationshipReport implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(public int $assessmentId) {}

    public function handle(RelationshipReportService $reports): void
    {
        $assessment = Assessment::find($this->assessmentId);
        if ($assessment === null) {
            return; // Deleted by the user meanwhile.
        }

        try {
            $reports->generate($assessment);
            $assessment->update(['status' => AssessmentStatus::Completed, 'failure_reason' => null]);
        } catch (Throwable $e) {
            $reason = $e instanceof ReportGenerationException ? $e->getMessage() : 'unexpected_error';

            // Log the reason only — never the answers or the prompt.
            Log::warning('Report generation failed.', ['assessment_id' => $assessment->id, 'reason' => $reason]);
            if (! $e instanceof ReportGenerationException) {
                report($e);
            }

            $assessment->update(['status' => AssessmentStatus::Failed, 'failure_reason' => $reason]);
        }
    }
}

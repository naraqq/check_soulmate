<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssessmentStatus;
use App\Http\Controllers\Controller;
use App\Jobs\GenerateRelationshipReport;
use App\Models\Assessment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * POST /api/assessments/{token}/generate-report
     *
     * Safe to call repeatedly: an existing report is returned as-is, and an
     * atomic status claim ensures only one OpenAI call runs per attempt.
     */
    public function generate(Assessment $assessment): JsonResponse
    {
        if ($assessment->status === AssessmentStatus::Completed && $assessment->report()->exists()) {
            return $this->reportResponse($assessment);
        }

        if (! $assessment->status->isPaid()) {
            return $this->paymentRequired();
        }

        if ($assessment->generation_attempts >= (int) config('soulmate.max_generation_attempts')
            && $assessment->status === AssessmentStatus::Failed) {
            return response()->json([
                'code' => 'generation_limit_reached',
                'status' => 'failed',
                'can_retry' => false,
            ], 429);
        }

        $staleBefore = now()->subMinutes((int) config('soulmate.generation_stale_minutes'));

        $claimed = Assessment::query()
            ->whereKey($assessment->id)
            ->where(function ($query) use ($staleBefore) {
                $query->whereIn('status', [AssessmentStatus::Paid, AssessmentStatus::Failed])
                    ->orWhere(fn ($q) => $q->where('status', AssessmentStatus::Generating)
                        ->where('generation_started_at', '<', $staleBefore));
            })
            ->update([
                'status' => AssessmentStatus::Generating,
                'generation_started_at' => now(),
                'generation_attempts' => DB::raw('generation_attempts + 1'),
                'failure_reason' => null,
            ]);

        if ($claimed === 1) {
            GenerateRelationshipReport::dispatch($assessment->id);
        }

        return $this->stateResponse($assessment->refresh());
    }

    /** GET /api/assessments/{token}/report — only returns content once completed. */
    public function show(Assessment $assessment): JsonResponse
    {
        if (! $assessment->status->isPaid()) {
            return $this->paymentRequired();
        }

        return $this->stateResponse($assessment);
    }

    private function stateResponse(Assessment $assessment): JsonResponse
    {
        // A worker that died mid-generation leaves the assessment "generating" forever.
        // Past the stale limit, report it as failed so the page offers a retry
        // (generate() re-claims stale assessments).
        $stale = $assessment->status === AssessmentStatus::Generating
            && $assessment->generation_started_at?->lt(now()->subMinutes((int) config('soulmate.generation_stale_minutes')));

        if ($stale) {
            return response()->json([
                'code' => 'report_generation_failed',
                'status' => 'failed',
                'can_retry' => $assessment->generation_attempts < (int) config('soulmate.max_generation_attempts'),
            ], 409);
        }

        return match ($assessment->status) {
            AssessmentStatus::Completed => $this->reportResponse($assessment),
            AssessmentStatus::Failed => response()->json([
                'code' => 'report_generation_failed',
                'status' => 'failed',
                'can_retry' => $assessment->generation_attempts < (int) config('soulmate.max_generation_attempts'),
            ], 409),
            // "paid" means payment confirmed but generation not yet requested.
            default => response()->json(['status' => $assessment->status->value], 202),
        };
    }

    private function reportResponse(Assessment $assessment): JsonResponse
    {
        $report = $assessment->report()->firstOrFail();

        return response()->json([
            'status' => 'completed',
            'report' => $report->report_json,
            'comparison' => app(\App\Services\CheckInComparison::class)->forAssessment($assessment),
            'feedback_submitted' => $assessment->feedback_submitted_at !== null,
            'created_at' => $report->created_at?->toIso8601String(),
        ]);
    }

    private function paymentRequired(): JsonResponse
    {
        return response()->json([
            'code' => 'payment_required',
            'message' => 'Payment has not been confirmed for this assessment.',
        ], 403);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssessmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentRequest;
use App\Models\Assessment;
use App\Services\Analytics;
use App\Services\Questionnaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class AssessmentController extends Controller
{
    public function __construct(
        private readonly Questionnaire $questionnaire,
        private readonly Analytics $analytics,
    ) {}

    /** POST /api/assessments */
    public function store(StoreAssessmentRequest $request): JsonResponse
    {
        $answers = $this->questionnaire->normalizeAnswers($request->validated('answers'));
        $teaser = $this->questionnaire->normalizeTeaser($request->validated('teaser'));

        $previous = null;
        if ($token = $request->validated('previous_assessment_token')) {
            $previous = Assessment::where('public_token', $token)
                ->where('status', AssessmentStatus::Completed)->whereHas('report')->first();
            if (! $previous) {
                throw ValidationException::withMessages(['previous_assessment_token' => ['previous_check_unavailable']]);
            }
        }

        $assessment = Assessment::create([
            'previous_assessment_id' => $previous?->id,
            'public_token' => Assessment::generateToken(),
            'questionnaire_version' => $this->questionnaire->version(),
            'answers_json' => $answers,
            'teaser_json' => $teaser,
            'status' => AssessmentStatus::Created,
            'analytics_json' => [
                ...$this->analytics->context($request->validated('attribution') ?? [], $request->userAgent()),
                ...$this->analytics->segment($answers),
            ],
        ]);
        $this->analytics->recordForAssessment('checkout_started', $assessment);

        return response()->json([
            'token' => $assessment->public_token,
            'status' => $assessment->status->value,
        ], 201);
    }

    /** GET /api/assessments/{token} — status summary, no answers. */
    public function show(Assessment $assessment): JsonResponse
    {
        return response()->json([
            'status' => $assessment->status->value,
            'paid' => $assessment->status->isPaid(),
            'teaser' => $this->questionnaire->teaserTitles($assessment->teaser_json),
            'track' => $this->questionnaire->track($assessment->answers_json ?? []),
            'created_at' => $assessment->created_at?->toIso8601String(),
        ]);
    }

    /** DELETE /api/assessments/{token} — removes answers and report permanently. */
    public function destroy(Assessment $assessment): Response
    {
        $assessment->delete();

        return response()->noContent();
    }
}

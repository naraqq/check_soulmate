<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssessmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentRequest;
use App\Models\Assessment;
use App\Services\Questionnaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class AssessmentController extends Controller
{
    public function __construct(private readonly Questionnaire $questionnaire) {}

    /** POST /api/assessments */
    public function store(StoreAssessmentRequest $request): JsonResponse
    {
        $answers = $this->questionnaire->normalizeAnswers($request->validated('answers'));
        $teaser = $this->questionnaire->normalizeTeaser($request->validated('teaser'));

        $assessment = Assessment::create([
            'public_token' => Assessment::generateToken(),
            'questionnaire_version' => $this->questionnaire->version(),
            'answers_json' => $answers,
            'teaser_json' => $teaser,
            'status' => AssessmentStatus::Created,
        ]);

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

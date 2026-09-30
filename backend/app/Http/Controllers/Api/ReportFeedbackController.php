<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssessmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ReportFeedbackController extends Controller
{
    public function store(Request $request, Assessment $assessment): Response
    {
        abort_unless($assessment->status === AssessmentStatus::Completed && $assessment->report()->exists(), 409);
        $feedback = $request->validate([
            'understood' => ['required', 'string', Rule::in(['yes', 'partly', 'no'])],
            'actionable' => ['required', 'string', Rule::in(['yes', 'partly', 'no'])],
            'concern' => ['nullable', 'string', Rule::in(['repetitive', 'not_my_situation', 'too_certain', 'unsafe', 'none'])],
        ]);
        // One response per assessment; repeat submissions update it. No free text, contacts or analytics.
        $assessment->forceFill(['feedback_json' => $feedback, 'feedback_submitted_at' => now()])->save();

        return response()->noContent();
    }
}

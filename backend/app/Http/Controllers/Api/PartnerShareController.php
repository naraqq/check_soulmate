<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssessmentStatus;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\PartnerShare;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PartnerShareController extends Controller
{
    private function requireReport(Assessment $assessment): void
    {
        abort_unless($assessment->status->isPaid(), 402, 'payment_required');
        abort_unless($assessment->status === AssessmentStatus::Completed && $assessment->report()->exists(), 409, 'report_not_ready');
    }

    public function show(Assessment $assessment): JsonResponse
    {
        $this->requireReport($assessment);
        $share = PartnerShare::where('assessment_id', $assessment->id)->first();

        return response()->json(['share' => $share ? ['token' => $share->token, 'content' => $share->content] : null]);
    }

    public function store(Request $request, Assessment $assessment): JsonResponse
    {
        $this->requireReport($assessment);
        $data = $request->validate([
            'sections' => ['required', 'array', 'min:1', 'max:3'],
            'sections.*' => ['required', 'string', 'distinct', 'in:strengths,areas_to_explore,conversation_starters'],
        ]);

        return DB::transaction(function () use ($assessment, $data) {
            $assessment = Assessment::whereKey($assessment->id)->lockForUpdate()->firstOrFail();
            $this->requireReport($assessment);
            $report = $assessment->report->report_json;
            $content = [];
            // Build a snapshot from trusted report fields only. Never serialize the report/model.
            foreach ($data['sections'] as $section) {
                $items = $report[$section] ?? [];
                if (! is_array($items) || count($items) === 0) {
                    throw ValidationException::withMessages(['sections' => 'This report section is unavailable.']);
                }
                $content[$section] = array_values(array_map(function ($item) use ($section) {
                    return $section === 'conversation_starters'
                        ? (string) $item
                        : ['title' => (string) $item['title'], 'description' => (string) $item['description']];
                }, $items));
            }
            $token = bin2hex(random_bytes(32));
            PartnerShare::updateOrCreate(['assessment_id' => $assessment->id], [
                'token_hash' => hash('sha256', $token), 'token' => $token, 'content' => $content,
            ]);

            return response()->json(['share' => ['token' => $token, 'content' => $content]], 201);
        });
    }

    public function destroy(Assessment $assessment): JsonResponse
    {
        // Revocation stays available even if the report's status subsequently changes.
        DB::transaction(function () use ($assessment) {
            Assessment::whereKey($assessment->id)->lockForUpdate()->firstOrFail();
            PartnerShare::where('assessment_id', $assessment->id)->delete();
        });

        return response()->json(null, 204);
    }

    public function publicShow(string $shareToken): JsonResponse
    {
        $share = PartnerShare::where('token_hash', hash('sha256', $shareToken))->firstOrFail();
        $assessment = Assessment::findOrFail($share->assessment_id);
        abort_unless($assessment->status === AssessmentStatus::Completed && $assessment->report()->exists(), 404);

        return response()->json(['content' => $share->content])->header('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }
}

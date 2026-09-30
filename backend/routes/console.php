<?php

use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// Remove abandoned, never-paid assessments (see Assessment::prunable).
Schedule::command('model:prune')->daily();

// Aggregate product feedback only: no tokens, relationship answers, or individual responses.
Artisan::command('reports:feedback {--days=30}', function () {
    $days = filter_var($this->option('days'), FILTER_VALIDATE_INT);
    if ($days === false || $days < 1 || $days > 365) {
        $this->error('Use --days between 1 and 365.');

        return 1;
    }
    $query = Assessment::where('status', AssessmentStatus::Completed)
        ->where('created_at', '>=', now()->subDays($days));
    $total = (clone $query)->count();
    $responses = 0;
    $counts = [];
    foreach ((clone $query)->whereNotNull('feedback_json')->cursor() as $assessment) {
        $responses++;
        foreach ($assessment->feedback_json as $field => $value) {
            $key = $assessment->questionnaire_version.' / '.$field.' / '.$value;
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }
    }
    $this->info("Completed checks created in the last {$days} days: {$total}; feedback responses: {$responses}");
    $this->line('Voluntary feedback may not represent everyone. No individual responses are shown.');
    ksort($counts);
    $this->table(['Questionnaire / measure / response', 'Count'], collect($counts)->map(fn ($count, $key) => [$key, $count])->values()->all());

    return 0;
})->purpose('Summarise voluntary report feedback without exposing personal answers');

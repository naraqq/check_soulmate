<?php

namespace App\Services;

use App\Enums\AssessmentStatus;
use App\Models\Assessment;

/** Stable, identical questions across stages. Never compare AI sentiment or category averages. */
class CheckInComparison
{
    private const TOPICS = [
        'communication' => 'Сонсож, ойлгох нь',
        'effort' => 'Хоёр талын санаачилга',
        'boundaries' => 'Хил хязгаарыг хүндэтгэх нь',
    ];

    private const SCALE = [
        'never' => 'Огт үгүй',
        'rarely' => 'Ховор',
        'sometimes' => 'Заримдаа',
        'often' => 'Ихэнхдээ',
        'almost_always' => 'Бараг үргэлж',
    ];

    public function forAssessment(Assessment $assessment): array
    {
        $previous = $assessment->previousAssessment;
        if (! $previous || $previous->status !== AssessmentStatus::Completed) {
            return ['status' => 'baseline', 'items' => $this->items([], $assessment->answers_json ?? [])];
        }

        return [
            'status' => 'compared',
            'previous_date' => $previous->created_at->toIso8601String(),
            'current_date' => $assessment->created_at->toIso8601String(),
            'days_between' => (int) $previous->created_at->diffInDays($assessment->created_at, true),
            'stage_changed' => ($previous->answers_json['basics_type'] ?? null) !== ($assessment->answers_json['basics_type'] ?? null),
            'items' => $this->items($previous->answers_json ?? [], $assessment->answers_json ?? []),
        ];
    }

    private function items(array $before, array $after): array
    {
        $items = [];
        $values = array_keys(self::SCALE);
        foreach (self::TOPICS as $topic => $label) {
            $old = $before['checkin_'.$topic] ?? null;
            $new = $after['checkin_'.$topic] ?? null;
            $oldIndex = array_search($old, $values, true);
            $newIndex = array_search($new, $values, true);
            $direction = $oldIndex === false || $newIndex === false
                ? 'not_comparable'
                : ($newIndex > $oldIndex ? 'improved' : ($newIndex < $oldIndex ? 'declined' : 'unchanged'));
            $items[] = [
                'topic' => $topic,
                'label' => $label,
                'previous' => self::SCALE[$old] ?? null,
                'current' => self::SCALE[$new] ?? null,
                'direction' => $direction,
            ];
        }

        return $items;
    }
}

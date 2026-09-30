<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;
use RuntimeException;

/**
 * Read-only access to the questionnaire exported from the frontend
 * (frontend/src/data/questions.ts → `npm run export:questions`).
 *
 * The backend never trusts question or option text from the client: answers
 * are submitted as ids/values and resolved to text here.
 */
class Questionnaire
{
    /** Minimum number of answered (non-context) questions for a meaningful report. */
    public const MIN_ANSWERED = 10;

    /** @var array{version: string, categories: list<array{id: string, label: string}>, questions: list<array<string, mixed>>, signals: array<string, string>} */
    private array $data;

    /** @var array<string, array<string, mixed>> */
    private array $questionsById = [];

    public function __construct(string $path)
    {
        if (! is_file($path)) {
            throw new RuntimeException("Questionnaire file missing at [{$path}]. Run `npm run export:questions` in frontend/.");
        }

        $this->data = json_decode((string) file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

        foreach ($this->data['questions'] as $question) {
            $this->questionsById[$question['id']] = $question;
        }
    }

    public function version(): string
    {
        return $this->data['version'];
    }

    /**
     * "early" (talking / dating) or "couple" — which question flow and report
     * the user gets. Mirrors frontend/src/data/track.ts.
     *
     * @param  array<string, string|null>  $answers
     */
    public function track(array $answers): string
    {
        $rule = $this->data['tracks'];
        $stage = $answers[$rule['stage_question']] ?? null;

        return in_array($stage, $rule['early_stages'], true) ? 'early' : 'couple';
    }

    /** @return list<array<string, mixed>> */
    public function questions(): array
    {
        return $this->data['questions'];
    }

    public function categoryLabel(string $id): string
    {
        foreach ($this->data['categories'] as $category) {
            if ($category['id'] === $id) {
                return $category['label'];
            }
        }

        return $id;
    }

    public function signalTitle(string $id): ?string
    {
        return $this->data['signals'][$id] ?? null;
    }

    /**
     * Validate and normalise submitted answers. Unknown question ids and
     * option values are rejected; missing questions are recorded as skipped.
     *
     * @param  array<mixed>  $answers
     * @return array<string, string|null>
     *
     * @throws ValidationException
     */
    public function normalizeAnswers(array $answers): array
    {
        $errors = [];

        foreach (array_keys($answers) as $id) {
            if (! is_string($id) || ! isset($this->questionsById[$id])) {
                $errors['answers'] = ['The answers contain an unknown question.'];
            }
        }

        $normalized = [];

        foreach ($this->questionsById as $id => $question) {
            $value = $answers[$id] ?? null;

            if ($value === null) {
                $normalized[$id] = null;

                continue;
            }

            if (! is_string($value)) {
                $errors["answers.{$id}"] = ['Invalid answer.'];

                continue;
            }

            if ($question['type'] === 'text') {
                $text = $this->sanitizeText($value, (int) ($question['max_length'] ?? 1000));
                $normalized[$id] = $text === '' ? null : $text;

                continue;
            }

            $allowed = array_column($question['options'], 'value');
            if (! in_array($value, $allowed, true)) {
                $errors["answers.{$id}"] = ['Invalid answer option.'];

                continue;
            }

            $normalized[$id] = $value;
        }

        // Drop answers to questions that don't apply (e.g. "how often do you meet" for married couples,
        // or the couple questions for someone who is only talking).
        foreach ($this->questionsById as $id => $question) {
            if (! $this->isVisible($question, $normalized)) {
                $normalized[$id] = null;
            }
        }

        // Count only answers that survived — answers to the other track's questions don't make a report meaningful.
        $answered = 0;
        foreach ($this->questionsById as $id => $question) {
            if ($question['category'] !== 'basics' && $question['type'] !== 'text' && ($normalized[$id] ?? null) !== null) {
                $answered++;
            }
        }

        if ($errors === [] && $answered < self::MIN_ANSWERED) {
            $errors['answers'] = ['Please answer more questions before finishing.'];
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $normalized;
    }

    /**
     * @param  array<mixed>|null  $teaser
     * @return array{strengths: list<string>, explore: list<string>, attention: string|null}
     */
    public function normalizeTeaser(?array $teaser): array
    {
        $valid = fn ($id) => is_string($id) && $this->signalTitle($id) !== null;

        $list = fn ($items) => array_values(array_slice(array_filter(is_array($items) ? $items : [], $valid), 0, 3));

        $attention = $teaser['attention'] ?? null;

        return [
            'strengths' => $list($teaser['strengths'] ?? []),
            'explore' => $list($teaser['explore'] ?? []),
            'attention' => $valid($attention) ? $attention : null,
        ];
    }

    /**
     * Resolve stored teaser ids to their titles.
     *
     * @param  array<string, mixed>|null  $teaser
     * @return array{strengths: list<string>, explore: list<string>, attention: string|null}
     */
    public function teaserTitles(?array $teaser): array
    {
        $titles = fn (array $ids) => array_values(array_filter(array_map(fn ($id) => $this->signalTitle($id), $ids)));

        return [
            'strengths' => $titles($teaser['strengths'] ?? []),
            'explore' => $titles($teaser['explore'] ?? []),
            'attention' => isset($teaser['attention']) ? $this->signalTitle($teaser['attention']) : null,
        ];
    }

    /**
     * Human-readable answers grouped by category, using trusted text only.
     *
     * @param  array<string, string|null>  $answers
     * @return array{context: list<array{question: string, answer: string}>, categories: array<string, array{label: string, answers: list<array{question: string, answer: string}>}>, open_reflection: string|null, flags: list<string>, skipped: int}
     */
    public function describe(array $answers): array
    {
        $result = ['context' => [], 'categories' => [], 'open_reflection' => null, 'flags' => [], 'skipped' => 0];

        foreach ($this->data['questions'] as $question) {
            if (! $this->isVisible($question, $answers)) {
                continue;
            }
            $value = $answers[$question['id']] ?? null;

            if ($value === null) {
                if (! ($question['optional'] ?? false) && $this->isVisible($question, $answers)) {
                    $result['skipped']++;
                }

                continue;
            }

            if ($question['type'] === 'text') {
                $result['open_reflection'] = $value;

                continue;
            }

            $option = collect($question['options'])->firstWhere('value', $value);
            if ($option === null) {
                continue;
            }

            $entry = ['question_id' => $question['id'], 'question' => $question['text'], 'answer' => $option['label']];

            if ($question['category'] === 'basics') {
                $result['context'][] = $entry;

                continue;
            }

            $result['categories'][$question['category']] ??= [
                'label' => $this->categoryLabel($question['category']),
                'answers' => [],
            ];
            $result['categories'][$question['category']]['answers'][] = $entry;

            if (isset($option['flag']) && ! in_array($option['flag'], $result['flags'], true)) {
                $result['flags'][] = $option['flag'];
            }
        }

        return $result;
    }

    /**
     * Mirrors frontend/src/data/visibility.ts.
     *
     * @param  array<string, mixed>  $question
     * @param  array<string, string|null>  $answers
     */
    public function isVisible(array $question, array $answers): bool
    {
        $rules = $question['visible_when'] ?? [];
        if (is_array($question['show_if'] ?? null)) {
            $rules[] = $question['show_if'];
        }
        foreach ($rules as $rule) {
            $value = $answers[$rule['question']] ?? null;
            if ($value === null) {
                return false;
            }
            if (is_array($rule['in'] ?? null) && ! in_array($value, $rule['in'], true)) {
                return false;
            }
            if (is_array($rule['not_in'] ?? null) && in_array($value, $rule['not_in'], true)) {
                return false;
            }
        }

        return true;
    }

    private function sanitizeText(string $value, int $maxLength): string
    {
        $text = strip_tags($value);
        // Drop control characters except newlines and tabs, then collapse excess whitespace.
        $text = preg_replace('/[^\P{C}\n\t]/u', '', $text) ?? '';
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? '';

        return mb_substr(trim($text), 0, $maxLength);
    }
}

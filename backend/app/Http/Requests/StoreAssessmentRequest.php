<?php

namespace App\Http\Requests;

use App\Services\Questionnaire;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssessmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // No accounts in the MVP; the public token identifies the assessment.
    }

    public function rules(): array
    {
        return [
            'questionnaire_version' => ['required', 'string', Rule::in([app(Questionnaire::class)->version()])],
            'answers' => ['required', 'array', 'max:100'],
            'teaser' => ['nullable', 'array'],
            'teaser.strengths' => ['nullable', 'array', 'max:3'],
            'teaser.strengths.*' => ['string', 'max:60'],
            'teaser.explore' => ['nullable', 'array', 'max:3'],
            'teaser.explore.*' => ['string', 'max:60'],
            'teaser.attention' => ['nullable', 'string', 'max:60'],
        ];
    }

    public function messages(): array
    {
        return [
            'questionnaire_version.in' => 'questionnaire_outdated',
        ];
    }
}

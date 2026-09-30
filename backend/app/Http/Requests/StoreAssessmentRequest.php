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
            'previous_assessment_token' => ['nullable', 'string', 'regex:/^[a-f0-9]{48}$/'],
            'answers' => ['required', 'array', 'max:160'],
            'teaser' => ['nullable', 'array'],
            'teaser.strengths' => ['nullable', 'array', 'max:3'],
            'teaser.strengths.*' => ['string', 'max:60'],
            'teaser.explore' => ['nullable', 'array', 'max:3'],
            'teaser.explore.*' => ['string', 'max:60'],
            'teaser.attention' => ['nullable', 'string', 'max:60'],
            // Anonymous analytics context (sanitised again in App\Services\Analytics).
            'attribution' => ['nullable', 'array'],
            'attribution.visitor_id' => ['nullable', 'string', 'max:40'],
            'attribution.source' => ['nullable', 'string', 'max:200'],
            'attribution.medium' => ['nullable', 'string', 'max:200'],
            'attribution.campaign' => ['nullable', 'string', 'max:200'],
            'attribution.referrer' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'questionnaire_version.in' => 'questionnaire_outdated',
        ];
    }
}

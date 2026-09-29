<?php

namespace Tests\Concerns;

use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use App\Services\Questionnaire;
use App\Services\RelationshipReportService;
use Illuminate\Support\Facades\Http;

trait BuildsAssessments
{
    /** A complete, valid answer set: the first option for every choice question. */
    protected function validAnswers(): array
    {
        $answers = [];
        foreach (app(Questionnaire::class)->questions() as $question) {
            $answers[$question['id']] = $question['type'] === 'text'
                ? 'Намайг илүү их сонсоосой гэж хүсдэг.'
                : $question['options'][0]['value'];
        }

        return $answers;
    }

    protected function submitPayload(array $overrides = []): array
    {
        return array_merge([
            'questionnaire_version' => app(Questionnaire::class)->version(),
            'answers' => $this->validAnswers(),
            'teaser' => [
                'strengths' => ['strength:communication', 'strength:trust', 'strength:future'],
                'explore' => ['explore:effort', 'explore:independence'],
                'attention' => 'pattern:initiation_imbalance',
            ],
        ], $overrides);
    }

    protected function createAssessment(AssessmentStatus $status = AssessmentStatus::Created): Assessment
    {
        $questionnaire = app(Questionnaire::class);

        return Assessment::create([
            'public_token' => Assessment::generateToken(),
            'questionnaire_version' => $questionnaire->version(),
            'answers_json' => $questionnaire->normalizeAnswers($this->validAnswers()),
            'teaser_json' => ['strengths' => ['strength:trust'], 'explore' => ['explore:effort'], 'attention' => null],
            'status' => $status,
        ]);
    }

    protected function fakeReport(): array
    {
        $section = ['summary' => 'Товч дүгнэлт.', 'observations' => ['Ажиглалт нэг.', 'Ажиглалт хоёр.']];
        $report = [
            'headline' => 'Та хоёрын харилцаанд дулаан суурь байна.',
            'summary' => 'Таны хариултаас харахад...',
            'strengths' => [['title' => 'Итгэлцэл', 'description' => 'Та хамтрагчдаа бүрэн итгэдэг гэж хариулсан.']],
            'areas_to_explore' => [['title' => 'Хүчин чармайлт', 'description' => 'Тайлбар.', 'importance' => 'moderate']],
            'patterns' => [['title' => 'Санаачлага', 'description' => 'Тайлбар.']],
            'conversation_starters' => ['Бид хоёр ... талаар ярилцаж болох уу?'],
            'closing' => 'Энэ бол таны өнөөгийн өнцөг юм.',
        ];
        foreach (RelationshipReportService::CATEGORY_SECTIONS as $category) {
            $report[$category] = $section;
        }

        return $report;
    }

    protected function openAiResponse(mixed $content): array
    {
        return [
            'choices' => [[
                'finish_reason' => 'stop',
                'message' => ['role' => 'assistant', 'content' => is_string($content) ? $content : json_encode($content, JSON_UNESCAPED_UNICODE), 'refusal' => null],
            ]],
        ];
    }

    /** Fake QPay auth + invoice + check endpoints. */
    protected function fakeQPay(bool $paid = false, int $paidAmount = 7900): void
    {
        Http::fake([
            'qpay.test/v2/auth/token' => Http::response(['access_token' => 'qpay-token', 'expires_in' => time() + 86400]),
            'qpay.test/v2/invoice' => Http::response([
                'invoice_id' => 'inv_123',
                'qr_text' => '0002010102121531...',
                'qr_image' => 'iVBORw0KGgo=',
                'qPay_shortUrl' => 'https://s.qpay.mn/abc',
                'urls' => [
                    ['name' => 'Khan bank', 'description' => 'Хаан банк', 'logo' => 'https://qpay.mn/khan.png', 'link' => 'khanbank://q?qPay_QRcode=abc'],
                ],
            ]),
            'qpay.test/v2/payment/check' => Http::response($paid
                ? ['count' => 1, 'paid_amount' => $paidAmount, 'rows' => [['payment_id' => 'pay_1', 'payment_status' => 'PAID', 'payment_amount' => (string) $paidAmount]]]
                : ['count' => 0, 'paid_amount' => 0, 'rows' => []]),
            'qpay.test/v2/payment/pay_1' => Http::response([
                'payment_id' => 'pay_1', 'payment_status' => 'PAID', 'payment_amount' => (string) $paidAmount, 'object_type' => 'INVOICE', 'object_id' => 'inv_123',
            ]),
        ]);
    }
}

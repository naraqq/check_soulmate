<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Report pricing
    |--------------------------------------------------------------------------
    |
    | The price is authoritative here. The frontend reads it from GET /api/config
    | so the amount is never hardcoded in the UI.
    |
    */

    'price' => (int) env('REPORT_PRICE', 7900),

    'currency' => env('REPORT_CURRENCY', 'MNT'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    /*
    |--------------------------------------------------------------------------
    | Development payment bypass
    |--------------------------------------------------------------------------
    |
    | Lets testers mark an assessment as paid without QPay. Outside production
    | PAYMENT_BYPASS alone enables it. In production it additionally requires
    | PAYMENT_BYPASS_IN_PRODUCTION=true — a deliberate, temporary opt-in (anyone
    | on the payment page can then unlock a report for free). See
    | App\Support\PaymentBypass.
    |
    */

    'payment_bypass' => (bool) env('PAYMENT_BYPASS', false),

    'payment_bypass_in_production' => (bool) env('PAYMENT_BYPASS_IN_PRODUCTION', false),

    'questionnaire_path' => resource_path('questionnaire/questions.json'),

    // The AI report is written in this language (the site itself is in Mongolian).
    'report_language' => env('REPORT_LANGUAGE', 'Mongolian (Cyrillic script)'),

    // Unpaid assessments are pruned after this many days (see Assessment::prunable).
    'unpaid_retention_days' => (int) env('UNPAID_RETENTION_DAYS', 30),

    // A "generating" assessment older than this is considered stuck and may be retried.
    // Must exceed the job timeout (7 min, see GenerateRelationshipReport::$timeout).
    'generation_stale_minutes' => 10,

    // Hard cap on OpenAI calls per assessment, so retries can't run up costs.
    'max_generation_attempts' => 4,

];

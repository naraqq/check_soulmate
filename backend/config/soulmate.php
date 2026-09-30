<?php

return [

    // Authoritative pricing; the frontend reads /api/config.
    'price' => (int) env('REPORT_PRICE', 7900),
    'currency' => env('REPORT_CURRENCY', 'MNT'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    // Test payments are restricted to local/testing, never production or staging.
    'payment_bypass' => (bool) env('PAYMENT_BYPASS', false),

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

    // Analytics dashboard (/admin). Empty key = dashboard disabled. Use a long random string.
    'analytics_key' => env('ANALYTICS_DASHBOARD_KEY', ''),

    // Days are grouped in this time zone, so "today" matches your business day.
    'analytics_timezone' => env('ANALYTICS_TIMEZONE', 'Asia/Ulaanbaatar'),

    // Anonymous analytics events older than this are pruned daily (model:prune).
    'analytics_retention_days' => (int) env('ANALYTICS_RETENTION_DAYS', 400),

];

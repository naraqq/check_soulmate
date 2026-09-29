<?php

// In production the SPA and API share one origin behind Nginx, so CORS is only
// needed when the frontend is served from a different origin (FRONTEND_URL).
return [

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter(explode(',', (string) env('FRONTEND_URL', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Accept', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,

];

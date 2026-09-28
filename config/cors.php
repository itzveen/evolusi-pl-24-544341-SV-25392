<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Aplikasi Vue di folder frontend/ berjalan di server Vite (port 5173)
    | dan setelah di-deploy di Vercel. Keduanya harus boleh mengakses
    | endpoint JSON /api/goals milik Laravel.
    |
    |_allowed origins_ diisi eksplisit — bukan "*" — supaya Origins
    | production tetap ketat sementara development tetap longgar.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter([
        // Dev server Vite
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // Vite preview
        'http://localhost:4173',
        'http://127.0.0.1:4173',
        // Host Vercel produksi — sesuaikan dengan URL deploy kamu
        env('FRONTEND_ORIGIN'),
    ])),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];

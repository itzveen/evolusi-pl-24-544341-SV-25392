<?php

use App\Http\Controllers\Api\GoalApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Endpoint JSON untuk aplikasi Vue di folder frontend/.
| Alamat endpoint: GET /api/goals
|
*/

Route::get('/goals', [GoalApiController::class, 'index']);
Route::get('/goals/{goal}', [GoalApiController::class, 'show']);

<?php

use App\Http\Controllers\GoalController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/goals', [GoalController::class, 'index'])->name('goals.index');
Route::post('/goals', [GoalController::class, 'store'])->name('goals.store');
Route::patch('/goals/{goal}/progress', [GoalController::class, 'updateProgress'])->name('goals.progress');
Route::delete('/goals/{goal}', [GoalController::class, 'destroy'])->name('goals.destroy');

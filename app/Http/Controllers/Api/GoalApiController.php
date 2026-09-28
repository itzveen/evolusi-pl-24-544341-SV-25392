<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoalApiController extends Controller
{
    /**
     * GET /api/goals
     *
     * Endpoint JSON untuk aplikasi Vue. Mengembalikan daftar goal beserta
     * persentase progres yang sudah dihitung di sisi server.
     */
    public function index(Request $request): JsonResponse
    {
        $goals = Goal::latest()->get();

        return response()->json([
            'data' => $goals->map(fn (Goal $goal): array => [
                'id' => $goal->id,
                'title' => $goal->title,
                'target' => $goal->target,
                'progress' => $goal->progress,
                'unit' => $goal->unit,
                'percentage' => $goal->percentage(),
                'is_completed' => $goal->progress >= $goal->target,
            ])->all(),
            'meta' => [
                'total' => $goals->count(),
                'completed' => $goals->filter(fn (Goal $goal): bool => $goal->progress >= $goal->target)->count(),
            ],
        ]);
    }

    /**
     * GET /api/goals/{goal}
     */
    public function show(Goal $goal): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $goal->id,
                'title' => $goal->title,
                'target' => $goal->target,
                'progress' => $goal->progress,
                'unit' => $goal->unit,
                'percentage' => $goal->percentage(),
                'is_completed' => $goal->progress >= $goal->target,
            ],
        ]);
    }
}

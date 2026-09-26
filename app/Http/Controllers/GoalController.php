<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    public function index()
    {
        $goals = Goal::latest()->get();

        return view('goals.index', compact('goals'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'target' => 'required|integer|min:1',
            'unit' => 'nullable|string|max:50',
        ]);

        Goal::create($request->only('title', 'target', 'unit'));

        return redirect()->route('goals.index');
    }

    public function updateProgress(Request $request, Goal $goal)
    {
        $request->validate(['progress' => 'required|integer|min:0']);

        $goal->update([
            'progress' => min($request->progress, $goal->target),
        ]);

        return redirect()->route('goals.index');
    }

    public function destroy(Goal $goal)
    {
        $goal->delete();

        return redirect()->route('goals.index');
    }
}

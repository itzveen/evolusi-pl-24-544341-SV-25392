<?php

namespace Tests\Feature;

use App\Models\Goal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_goals_returns_json_list(): void
    {
        Goal::create(['title' => 'Baca 10 buku', 'target' => 10, 'unit' => 'buku', 'progress' => 3]);
        Goal::create(['title' => 'Lari 5 km', 'target' => 5, 'unit' => 'km', 'progress' => 5]);

        $response = $this->getJson('/api/goals');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
        $response->assertJsonPath('meta.total', 2);
        $response->assertJsonPath('meta.completed', 1);
    }

    public function test_api_goals_includes_percentage_and_completion_flag(): void
    {
        Goal::create(['title' => 'Belajar Laravel', 'target' => 8, 'unit' => 'bab', 'progress' => 2]);

        $response = $this->getJson('/api/goals');

        $response->assertOk();
        $response->assertJsonPath('data.0.title', 'Belajar Laravel');
        $response->assertJsonPath('data.0.percentage', 25);
        $response->assertJsonPath('data.0.is_completed', false);
    }

    public function test_api_goal_show_returns_single_goal(): void
    {
        $goal = Goal::create(['title' => 'Jalan kaki', 'target' => 6, 'unit' => 'km', 'progress' => 6]);

        $response = $this->getJson("/api/goals/{$goal->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $goal->id);
        $response->assertJsonPath('data.percentage', 100);
        $response->assertJsonPath('data.is_completed', true);
    }

    public function test_api_goals_allows_vue_dev_server_origin(): void
    {
        Goal::create(['title' => 'Uji CORS', 'target' => 2, 'unit' => 'x']);

        $response = $this->getJson('/api/goals', [
            'Origin' => 'http://localhost:5173',
        ]);

        $response->assertOk();
        $response->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    }

    public function test_api_goals_rejects_unknown_origin(): void
    {
        Goal::create(['title' => 'Uji CORS tolak', 'target' => 2, 'unit' => 'x']);

        $response = $this->getJson('/api/goals', [
            'Origin' => 'http://penyerang.example.com',
        ]);

        $response->assertOk();
        $response->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}

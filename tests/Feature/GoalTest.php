<?php

namespace Tests\Feature;

use App\Models\Goal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoalTest extends TestCase
{
    use RefreshDatabase;

    public function test_goals_page_loads(): void
    {
        $response = $this->get('/goals');
        $response->assertStatus(200);
        $response->assertSee('Goal Tracker');
    }

    public function test_can_create_goal(): void
    {
        $response = $this->post('/goals', [
            'title' => 'Read 10 books',
            'target' => 10,
            'unit' => 'books',
        ]);

        $response->assertRedirect(route('goals.index'));
        $this->assertDatabaseHas('goals', [
            'title' => 'Read 10 books',
            'target' => 10,
            'unit' => 'books',
            'progress' => 0,
        ]);
    }

    public function test_can_update_progress(): void
    {
        $goal = Goal::create([
            'title' => 'Run 100km',
            'target' => 100,
            'unit' => 'km',
        ]);

        $response = $this->patch(route('goals.progress', $goal), [
            'progress' => 42,
        ]);

        $response->assertRedirect(route('goals.index'));
        $this->assertDatabaseHas('goals', [
            'id' => $goal->id,
            'progress' => 42,
        ]);
    }

    public function test_progress_cannot_exceed_target(): void
    {
        $goal = Goal::create([
            'title' => 'Do 50 pushups',
            'target' => 50,
            'unit' => 'reps',
        ]);

        $this->patch(route('goals.progress', $goal), [
            'progress' => 999,
        ]);

        $this->assertDatabaseHas('goals', [
            'id' => $goal->id,
            'progress' => 50, // capped at target
        ]);
    }

    public function test_can_delete_goal(): void
    {
        $goal = Goal::create([
            'title' => 'Temp goal',
            'target' => 5,
        ]);

        $response = $this->delete(route('goals.destroy', $goal));

        $response->assertRedirect(route('goals.index'));
        $this->assertDatabaseMissing('goals', ['id' => $goal->id]);
    }

    public function test_create_goal_requires_title(): void
    {
        $response = $this->post('/goals', [
            'target' => 10,
        ]);

        $response->assertSessionHasErrors('title');
    }

    public function test_goal_percentage_calculation(): void
    {
        $goal = new Goal([
            'title' => 'Test',
            'target' => 200,
            'progress' => 50,
        ]);

        $this->assertEquals(25, $goal->percentage());
    }
}

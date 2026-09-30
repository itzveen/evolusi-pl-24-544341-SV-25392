<?php

namespace Database\Seeders;

use App\Models\Goal;
use Illuminate\Database\Seeder;

/**
 * Seeder data contoh untuk endpoint GET /api/goals.
 *
 * Dipakai oleh Dockerfile (`php artisan migrate --force --seed`) supaya image
 * yang baru di-build langsung punya data. Dengan begitu endpoint API bisa
 * diuji dari luar container dan balasannya benar-benar berisi JSON, bukan
 * array kosong.
 */
class GoalSeeder extends Seeder
{
    public function run(): void
    {
        $goals = [
            ['title' => 'Selesaikan tugas Docker', 'target' => 10, 'progress' => 10, 'unit' => 'checkpoint'],
            ['title' => 'Belajar Git & CI/CD', 'target' => 8, 'progress' => 6, 'unit' => 'pertemuan'],
            ['title' => 'Latihan SQL', 'target' => 20, 'progress' => 5, 'unit' => 'soal'],
            ['title' => 'Review Accenture Onboarding', 'target' => 5, 'progress' => 2, 'unit' => 'modul'],
        ];

        foreach ($goals as $goal) {
            Goal::updateOrCreate(
                ['title' => $goal['title']],
                $goal,
            );
        }
    }
}

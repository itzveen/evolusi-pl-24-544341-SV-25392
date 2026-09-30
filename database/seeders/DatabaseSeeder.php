<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // Kolom `password` NOT NULL di Laravel 13, jadi harus diisi hash.
        // Password dummy "password" — bukan rahasia, hanya untuk data contoh.
        User::firstOrCreate([
            'email' => 'test@example.com',
        ], [
            'name' => 'Test User',
            'password' => Hash::make('password'),
        ]);

        // Data contoh untuk endpoint GET /api/goals (dipakai frontend/ Vue
        // dan screenshot pengujian Docker).
        $this->call(GoalSeeder::class);
    }
}

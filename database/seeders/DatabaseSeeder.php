<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin'
        ]);
        User::factory()->create([
            'name' => 'Employee',
            'email' => 'employee@example.com',
            'password' => Hash::make('employee123'),
            'role' => 'employee'
        ]);
        User::factory()->create([
            'name' => 'Student',
            'email' => 'student@example.com',
            'password' => Hash::make('student123'),
            'role' => 'student'
        ]);
    }
}

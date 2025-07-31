<?php

namespace Database\Seeders;

use App\Models\Log;
use App\Models\Student;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

        Student::factory()->create([
            'name' => 'Emils',
            'email' => 'ipa22.e.petersons@vtdt.edu.lv',
            'class' => 'IPa22',
            'uuid' => Str::uuid()->toString(),
        ]);

        Student::factory()->create([
            'name' => 'Raivo',
            'email' => 'ipa22.r.kinne@vtdt.edu.lv',
            'class' => 'IPa22',
            'uuid' => Str::uuid()->toString(),
        ]);

        Student::factory()->create([
            'name' => 'Kevins',
            'email' => 'ipa22.k.kanalis@vtdt.edu.lv',
            'class' => 'IPa22',
            'uuid' => Str::uuid()->toString(),
        ]);

        Student::factory(7)->create();

        Log::factory(30)->create();

    }
}

<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Log>
 */
class LogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'time' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'student_id' => Student::inRandomOrder()->first()->id,
            'action' => $this->faker->randomElement(['exit', 'entry']),
            'description' => $this->faker->paragraph(),
        ];
    }
}

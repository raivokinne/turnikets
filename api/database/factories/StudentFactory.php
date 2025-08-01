<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'class' => $this->faker->randomElement(['A', 'B', 'C', 'D', 'E', 'F']),
            'status' => $this->faker->randomElement(['klātbūtnē', 'prombūtnē']),
            'time' => now(),
            'uuid' => $this->faker->uuid(),
        ];
    }
}

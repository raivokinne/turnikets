<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\User;
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
        $action = $this->faker->randomElement([
            'entry', 'exit'
        ]);

        $student = null;
        $user = null;
        $description = '';
        $time = $this->faker->dateTimeBetween('-1 year', 'now');

        switch ($action) {
            case 'entry':
                $student = Student::inRandomOrder()->first();
                $description = $student->name . ' ienāca iekšā ' . $time->format('Y-m-d H:i:s');
                break;
            case 'exit':
                $student = Student::inRandomOrder()->first();
                $description = $student->name . ' izgāja āra ' . $time->format('Y-m-d H:i:s');
                break;
            default:
                $description = $this->faker->sentence();
        }

        return [
            'time' => $time,
            'student_id' => $student ? $student->id : null,
            'user_id' => $user ? $user->id : null,
            'action' => $action,
            'description' => $description,
        ];
    }

    /**
     * Create entry/exit logs for attendance
     */
    public function attendance(): static
    {
        return $this->state(function (array $attributes) {
            $student = Student::inRandomOrder()->first();
            $action = $this->faker->randomElement(['entry', 'exit']);

            return [
                'student_id' => $student->id,
                'user_id' => null,
                'action' => $action,
                'description' => "Student scanned QR code for {$action}",
                'time' => $this->faker->dateTimeBetween('-30 days', 'now'),
            ];
        });
    }

    /**
     * Create student management logs
     */
    public function studentManagement(): static
    {
        return $this->state(function (array $attributes) {
            $student = Student::inRandomOrder()->first();
            $user = User::inRandomOrder()->first();
            $action = $this->faker->randomElement(['student_created', 'student_updated', 'student_deleted']);

            $descriptions = [
                'student_created' => "Student '{$student->name}' created by {$user->name}",
                'student_updated' => "Student '{$student->name}' updated by {$user->name}. Changes: status from 'prombutnē' to 'klātbutne'",
                'student_deleted' => "Student '{$student->name}' deleted by {$user->name}"
            ];

            return [
                'student_id' => $action === 'student_deleted' ? $student->id : $student->id,
                'user_id' => $user->id,
                'action' => $action,
                'description' => $descriptions[$action],
                'time' => $this->faker->dateTimeBetween('-6 months', 'now'),
            ];
        });
    }

    /**
     * Create user activity logs
     */
    public function userActivity(): static
    {
        return $this->state(function (array $attributes) {
            $user = User::inRandomOrder()->first();
            $action = $this->faker->randomElement(['login', 'logout', 'profile_update']);

            $descriptions = [
                'login' => "User login from web interface",
                'logout' => "User logout from web interface",
                'profile_update' => "User profile updated. Changes: email, phone"
            ];

            return [
                'student_id' => null,
                'user_id' => $user->id,
                'action' => $action,
                'description' => $descriptions[$action],
                'time' => $this->faker->dateTimeBetween('-3 months', 'now'),
            ];
        });
    }

    /**
     * Create mass upload logs
     */
    public function massUpload(): static
    {
        return $this->state(function (array $attributes) {
            $user = User::inRandomOrder()->first();
            $created = $this->faker->numberBetween(20, 100);
            $errors = $this->faker->numberBetween(0, 10);
            $total = $created + $errors;

            return [
                'student_id' => null,
                'user_id' => $user->id,
                'action' => 'mass_student_upload',
                'description' => "Mass student upload by {$user->name}. Created: {$created}, Errors: {$errors}, Total processed: {$total}",
                'time' => $this->faker->dateTimeBetween('-1 year', 'now'),
            ];
        });
    }

    /**
     * Create email failure logs
     */
    public function emailFailure(): static
    {
        return $this->state(function (array $attributes) {
            $student = Student::inRandomOrder()->first();
            $user = User::inRandomOrder()->first();

            return [
                'student_id' => $student->id,
                'user_id' => $user->id,
                'action' => 'email_send_failed',
                'description' => $this->faker->randomElement([
                    "Failed to send QR code email to student",
                    "Email delivery failed - invalid email address",
                    "SMTP error during email sending"
                ]),
                'time' => $this->faker->dateTimeBetween('-6 months', 'now'),
            ];
        });
    }

    /**
     * Create recent logs (within last 7 days)
     */
    public function recent(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'time' => $this->faker->dateTimeBetween('-7 days', 'now'),
            ];
        });
    }

    /**
     * Create logs for today
     */
    public function today(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'time' => $this->faker->dateTimeBetween('today', 'now'),
            ];
        });
    }

    /**
     * Create paired entry/exit logs for realistic attendance
     */
    public function pairedAttendance(): static
    {
        return $this->state(function (array $attributes) {
            $student = Student::inRandomOrder()->first();
            $baseTime = $this->faker->dateTimeBetween('-30 days', 'now');

            return [
                'student_id' => $student->id,
                'user_id' => null,
                'action' => 'entry',
                'description' => "Student scanned QR code for entry",
                'time' => $baseTime,
            ];
        });
    }
}

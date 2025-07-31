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
            'entry', 'exit', 'login', 'logout', 'profile_update',
            'user_created', 'student_created', 'student_updated',
            'student_deleted', 'mass_student_upload', 'email_send_failed'
        ]);

        $student = null;
        $user = null;
        $description = '';

        switch ($action) {
            case 'entry':
            case 'exit':
                $student = Student::inRandomOrder()->first();
                $description = $this->faker->randomElement([
                    "Student scanned QR code for {$action}",
                    "Automatic {$action} logged via access system",
                    "Manual {$action} recorded"
                ]);
                break;

            case 'login':
            case 'logout':
                $user = User::inRandomOrder()->first();
                $description = $this->faker->randomElement([
                    "User {$action} from web interface",
                    "User {$action} from mobile app",
                    "Automatic {$action} due to session timeout"
                ]);
                break;

            case 'profile_update':
                $user = User::inRandomOrder()->first();
                $changes = $this->faker->randomElements([
                    'name', 'email', 'phone', 'address', 'preferences'
                ], $this->faker->numberBetween(1, 3));
                $description = "User profile updated. Changes: " . implode(', ', $changes);
                break;

            case 'user_created':
                $user = User::inRandomOrder()->first();
                $newUserName = $this->faker->name();
                $description = "User '{$newUserName}' created by " . ($user ? $user->name : 'System');
                break;

            case 'student_created':
                $student = Student::inRandomOrder()->first();
                $user = User::inRandomOrder()->first();
                $description = "Student '{$student->name}' created by " . ($user ? $user->name : 'System');
                break;

            case 'student_updated':
                $student = Student::inRandomOrder()->first();
                $user = User::inRandomOrder()->first();
                $changes = $this->faker->randomElements([
                    "status from 'prombutnē' to 'klātbutne'",
                    "class from '10A' to '10B'",
                    "email from 'old@email.com' to 'new@email.com'",
                    "name from 'Old Name' to 'New Name'"
                ], $this->faker->numberBetween(1, 2));
                $description = "Student '{$student->name}' updated by " . ($user ? $user->name : 'System') . ". Changes: " . implode(', ', $changes);
                break;

            case 'student_deleted':
                $student = Student::inRandomOrder()->first();
                $user = User::inRandomOrder()->first();
                $description = "Student '{$student->name}' deleted by " . ($user ? $user->name : 'System');
                break;

            case 'mass_student_upload':
                $user = User::inRandomOrder()->first();
                $created = $this->faker->numberBetween(15, 50);
                $errors = $this->faker->numberBetween(0, 5);
                $total = $created + $errors;
                $description = "Mass student upload by " . ($user ? $user->name : 'System') . ". Created: {$created}, Errors: {$errors}, Total processed: {$total}";
                // For mass upload, student_id should be null as it's a general operation
                $student = null;
                break;

            case 'email_send_failed':
                $student = Student::inRandomOrder()->first();
                $user = User::inRandomOrder()->first();
                $description = $this->faker->randomElement([
                    "Failed to send QR code email to student",
                    "Email delivery failed - invalid email address",
                    "SMTP error during email sending",
                    "Email service temporarily unavailable"
                ]);
                break;

            default:
                $description = $this->faker->sentence();
        }

        return [
            'time' => $this->faker->dateTimeBetween('-1 year', 'now'),
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

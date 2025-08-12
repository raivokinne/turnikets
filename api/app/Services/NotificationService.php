<?php

namespace App\Services;

use App\Models\Log;
use App\Models\Student;
use Pusher\Pusher;
use Illuminate\Support\Facades\Log as LaravelLog;

class NotificationService
{
    private Pusher $pusher;

    public function __construct()
    {
        $this->pusher = new Pusher(
            config('broadcasting.connections.pusher.key'),
            config('broadcasting.connections.pusher.secret'),
            config('broadcasting.connections.pusher.app_id'),
            [
                'cluster' => config('broadcasting.connections.pusher.options.cluster'),
                'useTLS' => true
            ]
        );
    }

    /**
     * Check for consecutive entry/exit actions and send warning if detected
     */
    public function checkConsecutiveAction(Student $student, string $newAction): bool
    {
        // Get the last two logs for this student
        $lastTwoLogs = Log::where('student_id', $student->id)
            ->orderBy('time', 'desc')
            ->limit(2)
            ->get();

        // If we don't have at least one previous log, no warning needed
        if ($lastTwoLogs->count() < 1) {
            return false;
        }

        $lastAction = $lastTwoLogs->first()->action;

        // Check if the new action is the same as the last action (consecutive)
        if ($lastAction === $newAction) {
            $this->sendConsecutiveActionWarning($student, $newAction);
            return true;
        }

        return false;
    }

    /**
     * Send WebSocket notification for consecutive action warning
     */
    private function sendConsecutiveActionWarning(Student $student, string $action): void
    {
        $message = [
            'type' => 'consecutive_action_warning',
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
            ],
            'action' => $action,
            'message' => "Warning: {$student->name} attempted {$action} twice in a row!",
            'timestamp' => now()->toISOString(),
        ];

        try {
            // Send to general notifications channel
            $this->pusher->trigger('notifications', 'consecutive-action', $message);
            
            // Send to student-specific channel
            $this->pusher->trigger("student.{$student->id}", 'consecutive-action', $message);
            
            LaravelLog::info('Consecutive action warning sent', $message);
        } catch (\Exception $e) {
            LaravelLog::error('Failed to send WebSocket notification: ' . $e->getMessage());
        }
    }

    /**
     * Send general entry/exit notification
     */
    public function sendEntryExitNotification(Student $student, string $action, string $description): void
    {
        $message = [
            'type' => 'entry_exit',
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
            ],
            'action' => $action,
            'description' => $description,
            'timestamp' => now()->toISOString(),
        ];

        try {
            $this->pusher->trigger('notifications', 'entry-exit', $message);
            $this->pusher->trigger("student.{$student->id}", 'entry-exit', $message);
        } catch (\Exception $e) {
            LaravelLog::error('Failed to send entry/exit notification: ' . $e->getMessage());
        }
    }
}

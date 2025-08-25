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
            config('broadcasting.connections.reverb.key'),
            config('broadcasting.connections.reverb.secret'),
            config('broadcasting.connections.reverb.app_id'),
            [
                'host' => config('broadcasting.connections.reverb.options.host'),
                'port' => config('broadcasting.connections.reverb.options.port'),
                'scheme' => config('broadcasting.connections.reverb.options.scheme'),
                'useTLS' => config('broadcasting.connections.reverb.options.scheme') === 'https',
            ]
        );
    }

    /**
     * Broadcast a new log entry to WebSocket
     */
    public function broadcastNewLog(Log $log): void
    {
        $student = $log->student;

        $message = [
            'type' => 'new_log',
            'log' => [
                'id' => $log->id,
                'time' => $log->time->toISOString(),
                'action' => $log->action,
                'description' => $log->description,
                'student_id' => $log->student_id,
            ],
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'status' => $student->status,
            ],
            'timestamp' => now()->toISOString(),
        ];

        try {
            $this->pusher->trigger('logs', 'new-log', $message);

            $this->pusher->trigger('notifications', 'new-log', $message);

            LaravelLog::info('New log broadcasted', ['log_id' => $log->id]);
        } catch (\Exception $e) {
            LaravelLog::error('Failed to broadcast new log: ' . $e->getMessage());
        }
    }

    /**
     * Check for consecutive entry/exit actions and send warning if detected
     */
    public function checkConsecutiveAction(Student $student, string $newAction): bool
    {
        $lastTwoLogs = Log::where('student_id', $student->id)
            ->whereIn('action', ['entry', 'exit'])
            ->orderBy('time', 'desc')
            ->limit(2)
            ->get();

        if ($lastTwoLogs->count() < 1) {
            return false;
        }

        $lastAction = $lastTwoLogs->first()->action;

        if ($lastAction === $newAction) {
            $this->sendConsecutiveActionWarning($student, $newAction);
            return true;
        }

        return false;
    }

    /**
     * Send WebSocket notification for consecutive action warning
     */
    public function sendConsecutiveActionWarning(Student $student, string $action): void
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
            $this->pusher->trigger('notifications', 'consecutive-action', $message);

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

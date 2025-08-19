<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Services\NotificationService;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;

class GateController extends Controller {
    public function RequestCardEvent(Request $request): void {
        error_log("Request Card event");
        $card = $request->all()['Card'];
        error_log($card);
        $ip = $request->all()['IP'];
        error_log($ip);
        $reader = $request->all()['Reader'];
        error_log($reader);
        $student = Student::query()->where('uuid', $card)->first();
        error_log($student->name);

        if ($student) {
            $notifier = app(NotificationService::class);
            $lastLog = Log::query()
                ->where('student_id', $student->id)
                ->orderBy('time', 'desc')
                ->first();

            // Determine intended action based on reader direction
            // reader == 1 => exiting, reader == 0 => entering
            $intendedAction = $reader == 1 ? 'exit' : 'entry';

            // If last action equals intended action, this is a consecutive same action -> send warning and do NOT open the gate
            if ($lastLog && $lastLog->action === $intendedAction) {
                $notifier->checkConsecutiveAction($student, $intendedAction);
                return;
            }

            // Otherwise proceed: create log, open gate, and send normal notification
            if ($intendedAction === 'exit') {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'exit',
                    'description' => $student->name . ' izgāja āra ' . now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'prombūtnē';
                $student->save();
                Http::get('http://' . $ip . '/cdor.cgi', [
                    'open' => 1,
                    'door' => $reader,
                ]);
            } else {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'entry',
                    'description' => $student->name . ' ienāca iekšā ' . now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'klātbūtnē';
                $student->save();
                Http::get('http://' . $ip . '/cdor.cgi', [
                    'open' => 1,
                    'door' => $reader,
                ]);
            }

            $notifier->sendEntryExitNotification($student, $intendedAction, $intendedAction === 'exit'
                ? $student->name . ' izgāja āra '
                : $student->name . ' ienāca iekšā ' . now()->format('Y-m-d H:i:s'));
        }
    }

    private static array $gateStates = [
        1 => false,
        2 => false,
    ];

    private function getGateIp(int $number): string {
        return match ($number) {
            1 => env('GATE_1_IP', '192.168.8.1'),
            2 => env('GATE_2_IP', '192.168.8.2'),
            default => throw new InvalidArgumentException("Invalid gate number: {$number}")
        };
    }

    public function OpenGate(int $number): \Illuminate\Http\JsonResponse {
        try {
            $ip = $this->getGateIp($number);

            // Open the gate
            Http::get("http://{$ip}/cdor.cgi", [
                'open' => 1,
                'door' => 1,
            ]);

            // Wait 5 seconds
            sleep(5);

            // Close the gate
            Http::get("http://{$ip}/cdor.cgi", [
                'open' => 0,
                'door' => 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Gate {$number} opened for 5 seconds and closed",
                'gateNumber' => $number
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Failed to operate gate {$number}: " . $e->getMessage(),
                'gateNumber' => $number
            ], 500);
        }
    }

    public function ToggleGate(int $number): \Illuminate\Http\JsonResponse {
        try {
            if (!in_array($number, [1, 2])) {
                return response()->json(['error' => 'Invalid gate number'], 400);
            }

            $ip = $this->getGateIp($number);

            // Toggle the state
            $oldState = self::$gateStates[$number];
            self::$gateStates[$number] = !self::$gateStates[$number];

            // Send command based on new state
            Http::get("http://{$ip}/cdor.cgi", [
                'open' => self::$gateStates[$number] ? 1 : 0,
                'door' => 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Gate {$number} toggled from " . ($oldState ? 'open' : 'closed') . ' to ' . (self::$gateStates[$number] ? 'open' : 'closed'),
                'gateNumber' => $number,
                'isOpen' => self::$gateStates[$number],
                'previousState' => $oldState
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Failed to toggle gate {$number}: " . $e->getMessage(),
                'gateNumber' => $number
            ], 500);
        }
    }

    // API method to get current gate state (returns JSON)
    public function getGateState(int $number): \Illuminate\Http\JsonResponse {
        if (!in_array($number, [1, 2])) {
            return response()->json(['error' => 'Invalid gate number'], 400);
        }

        return response()->json([
            'gateNumber' => $number,
            'isOpen' => self::$gateStates[$number] ?? false,
            'status' => self::$gateStates[$number] ? 'open' : 'closed'
        ]);
    }

    // Helper method to get all gate states
    public function getAllGateStates(): array {
        return self::$gateStates;
    }

    // Optional: Method to manually set gate state (useful for initialization)
    public function setGateState(int $number, bool $isOpen): void {
        if (!in_array($number, [1, 2])) {
            throw new InvalidArgumentException("Invalid gate number: {$number}");
        }

        self::$gateStates[$number] = $isOpen;
    }
}

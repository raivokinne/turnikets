<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Services\NotificationService;
use Illuminate\Http\Client\Response;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

class GateController extends Controller
{
    private const HEARTBEAT_TIMEOUT = 10;

    public function RequestStatus(Request $request): void
    {
        $ip = $request->all()['IP'];

        $gateNumber = $this->getGateNumberByIp($ip);

        if ($gateNumber) {
            Cache::put("gate_{$gateNumber}_heartbeat", now()->timestamp, now()->addMinutes(5));
        }
    }

    public function RequestCardEvent(Request $request): void
    {
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

            $intendedAction = $reader == 1 ? 'exit' : 'entry';

            if ($lastLog && $lastLog->action === $intendedAction) {
                $notifier->checkConsecutiveAction($student, $intendedAction);
                return;
            }

            if ($intendedAction === 'exit') {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'exit',
                    'description' => $student->name.' izgāja āra '.now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'prombūtnē';
                $student->save();
                Http::get('http://'.$ip.'/cdor.cgi', [
                    'open' => 1,
                    'door' => $reader,
                ]);
            } else {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'entry',
                    'description' => $student->name.' ienāca iekšā '.now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'klātbūtnē';
                $student->save();
                Http::get('http://'.$ip.'/cdor.cgi', [
                    'open' => 1,
                    'door' => $reader,
                ]);
            }

            $notifier->sendEntryExitNotification($student, $intendedAction, $intendedAction === 'exit'
                ? $student->name . ' izgāja āra '
                : $student->name . ' ienāca iekšā ' . now()->format('Y-m-d H:i:s'));

        }
    }

    private function getGateIp(int $number): string
    {
        return match($number) {
            1 => env('GATE_1_IP', '192.168.8.1'),
            2 => env('GATE_2_IP', '192.168.8.2'),
            default => throw new InvalidArgumentException("Invalid gate number: {$number}")
        };
    }

    private function getGateNumberByIp(string $ip): ?int
    {
        $gate1Ip = env('GATE_1_IP', '192.168.8.1');
        $gate2Ip = env('GATE_2_IP', '192.168.8.2');

        return match($ip) {
            $gate1Ip => 1,
            $gate2Ip => 2,
            default => null
        };
    }

    private function getCurrentGateState(int $gateNumber): bool
    {
        return Cache::get("gate_{$gateNumber}_state", false);
    }

    private function setGateState(int $gateNumber, bool $state): void
    {
        Cache::put("gate_{$gateNumber}_state", $state, now()->addDays(1));
    }

    private function isGateOnline(int $gateNumber): bool
    {
        $lastHeartbeat = Cache::get("gate_{$gateNumber}_heartbeat");

        if (!$lastHeartbeat) {
            return false;
        }

        return (now()->timestamp - $lastHeartbeat) <= self::HEARTBEAT_TIMEOUT;
    }

    public function OpenGate(int $number): \Illuminate\Http\JsonResponse
    {
        try {
            $ip = $this->getGateIp($number);
            $this->setGateState($number, true);
            Http::get("http://{$ip}/cdor.cgi", [
                'open' => 10,
            ]);
            sleep(5);
            Http::get("http://{$ip}/cdor.cgi", [
                'open' => 11,
            ]);
            $this->setGateState($number, false);

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

    public function ToggleGate(int $number): \Illuminate\Http\JsonResponse
    {
        try {
            if (!in_array($number, [1, 2])) {
                return response()->json(['error' => 'Invalid gate number'], 400);
            }

            $ip = $this->getGateIp($number);

            $currentState = $this->getCurrentGateState($number);
            $newState = !$currentState;

            $command = $newState ? 10 : 11;
            Http::get("http://{$ip}/cdor.cgi", [
                'open' => $command,
            ]);
            $this->setGateState($number, $newState);

            return response()->json([
                'success' => true,
                'message' => "Gate {$number} toggled from " . ($currentState ? 'open' : 'closed') . ' to ' . ($newState ? 'open' : 'closed'),
                'gateNumber' => $number,
                'isOpen' => $newState,
                'previousState' => $currentState
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Failed to toggle gate {$number}: " . $e->getMessage(),
                'gateNumber' => $number
            ], 500);
        }
    }

    public function getGateState(int $number): \Illuminate\Http\JsonResponse
    {
        if (!in_array($number, [1, 2])) {
            return response()->json(['error' => 'Invalid gate number'], 400);
        }

        $isOpen = $this->getCurrentGateState($number);
        $isOnline = $this->isGateOnline($number);

        return response()->json([
            'success' => true,
            'data' => [
                'gateNumber' => $number,
                'isOpen' => $isOpen,
                'isOnline' => $isOnline,
                'status' => $isOpen ? 'open' : 'closed',
                'connectionStatus' => $isOnline ? 'online' : 'offline'
            ]
        ]);
    }

    public function getAllGateStates(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            1 => [
                'isOpen' => $this->getCurrentGateState(1),
                'isOnline' => $this->isGateOnline(1)
            ],
            2 => [
                'isOpen' => $this->getCurrentGateState(2),
                'isOnline' => $this->isGateOnline(2)
            ]
        ]);
    }

    public function setGateStateManual(int $number, Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            if (!in_array($number, [1, 2])) {
                return response()->json(['error' => 'Invalid gate number'], 400);
            }

            $isOpen = $request->boolean('isOpen', false);
            $this->setGateState($number, $isOpen);

            return response()->json([
                'success' => true,
                'message' => "Gate {$number} state manually set to " . ($isOpen ? 'open' : 'closed'),
                'gateNumber' => $number,
                'isOpen' => $isOpen
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Failed to set gate {$number} state: " . $e->getMessage(),
                'gateNumber' => $number
            ], 500);
        }
    }
}

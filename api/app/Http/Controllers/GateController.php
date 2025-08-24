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
    private const DUPLICATE_SCAN_TIMEOUT = 10;

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
        $card = $request->all()['Card'];
        $ip = $request->all()['IP'];
        $reader = $request->all()['Reader'];
        $student = Student::query()->where('uuid', $card)->first();

        if ($student) {
            $notifier = app(NotificationService::class);

            $lastLog = Log::query()
                ->where('student_id', $student->id)
                ->whereIn('action', ['entry', 'exit'])
                ->orderBy('time', 'desc')
                ->first();

            if ($lastLog && $lastLog->time->diffInSeconds(now()) < self::DUPLICATE_SCAN_TIMEOUT) {
                $this->openGateForReader($ip, $reader);
                return;
            }

            $lastLog = Log::query()
                ->where('student_id', $student->id)
                ->orderBy('time', 'desc')
                ->first();

            $intendedAction = $reader == 1 ? 'exit' : 'entry';

            if ($lastLog && $lastLog->action === $intendedAction) {
                $notifier->checkConsecutiveAction($student, $intendedAction);
                $this->openGateForReader($ip, $reader);

                if ($intendedAction == 'entry') {
                    $student->status = 'klātbūtnē';
                    Log::create([
                        'time' => now(),
                        'student_id' => $student->id,
                        'action' => 'entry',
                        'description' => $student->name.' ienāca iekšā '.now()->format('Y-m-d H:i:s'). ' divreiz!',
                    ]);
                } else {
                    $student->status = 'prombūtnē';
                    Log::create([
                        'time' => now(),
                        'student_id' => $student->id,
                        'action' => 'entry',
                        'description' => $student->name.' izgāja ārā '.now()->format('Y-m-d H:i:s'). ' divreiz!',
                    ]);
                }

                $student->save();
                return;
            }

            if ($intendedAction === 'exit') {
                $log = Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'exit',
                    'description' => $student->name.' izgāja āra '.now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'prombūtnē';
                $student->save();

                $this->openGateForReader($ip, $reader);

                $notifier->broadcastNewLog($log);

                $notifier->sendEntryExitNotification($student, $intendedAction,
                    $student->name . ' izgāja āra ' . now()->format('Y-m-d H:i:s'));
            } else {
                $log = Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'entry',
                    'description' => $student->name.' ienāca iekšā '.now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'klātbūtnē';
                $student->save();

                $this->openGateForReader($ip, $reader);

                $notifier->broadcastNewLog($log);

                $notifier->sendEntryExitNotification($student, $intendedAction,
                    $student->name . ' ienāca iekšā ' . now()->format('Y-m-d H:i:s'));
            }
        }
    }

    /**
     * Helper method to open the gate for a specific reader
     */
    private function openGateForReader(string $ip, int $reader): void
    {
        Http::get('http://'.$ip.'/cdor.cgi', [
            'open' => 1,
            'door' => $reader,
        ]);
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
}

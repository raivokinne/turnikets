<?php

namespace App\Http\Controllers;

use App\Models\AccessCredential;
use App\Models\Student;
use App\Models\Log;
use App\Services\NotificationService;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GateController extends Controller
{
    public function RequestCardEvent(Request $request): void
    {
        $card = $request->all()['Card'];
        $ip = $request->all()['IP'];
        $reader = $request->all()['Reader'];
        $aC = AccessCredential::query()->where('uuid', $card)->first();
        $student = Student::query()->where('id', $aC->student_id)->first();

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
            } else {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'entry',
                    'description' => $student->name . ' ienāca iekšā ' . now()->format('Y-m-d H:i:s'),
                ]);
            }

            $this->OpenGate($ip, $reader);
            $notifier->sendEntryExitNotification($student, $intendedAction, $intendedAction === 'exit'
                ? $student->name . ' izgāja āra '
                : $student->name . ' ienāca iekšā ' . now()->format('Y-m-d H:i:s'));

        }
    }

    public function RequestStatus(Request $request): void
    {
        foreach ($request->all() as $key => $value) { //debug un ari nekam citam drosvien netiks izmantots
            error_log($key.': '.$value);
        }
    }

    private function OpenGate(string $gateIp,int $reader): void
    {
        Http::get($gateIp, [ //env var iet kast ip in gudrak tik un ta
            'open' => $reader, //lai veras uz pareizo virzienu abiem jabut vienadiem
            'door' => $reader,
        ]);
    }


    private function OpenBothGate(string $gateIp1,string $gateIp2): void
    {
        Http::get($gateIp1, [
            'open' => 1,
            'door' => 1,
        ]);
        Http::get($gateIp2, [
            'open' => 0,
            'door' => 0,
        ]);
    }

}

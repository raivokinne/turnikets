<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GateController extends Controller
{
    public function RequestCardEvent(Request $request): void
    {
        $card = $request->all()['Card'];
        $ip = $request->all()['IP'];
        $reader = $request->all()['Reader'];
        $student = Student::query()->where('uuid', $card)->first();

        if ($student) {
            $lastLog = Log::query()->where('student_id', $student->id)->orderBy('time', 'desc')->first();
            if ($reader == 1 && $lastLog->action == 'entry') {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'exit',
                    'description' => $student->name.' izgāja āra '.now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'prombūtnē';
                $student->save();
                Http::get($gateIp, [
                    'open' => $reader,
                    'door' => $reader,
                ]);
            } elseif ($reader == 0 && $lastLog->action == 'exit') {
                Log::create([
                    'time' => now(),
                    'student_id' => $student->id,
                    'action' => 'entry',
                    'description' => $student->name.' ienāca iekšā '.now()->format('Y-m-d H:i:s'),
                ]);
                $student->status = 'klātbūtnē';
                $student->save();
                Http::get($gateIp, [
                    'open' => $reader,
                    'door' => $reader,
                ]);
            }

        }
    }

    public function RequestStatus(Request $request): void
    {
        foreach ($request->all() as $key => $value) { // debug un ari nekam citam drosvien netiks izmantots
            error_log($key.': '.$value);
        }
    }

    private function OpenGate(string $gateIp, int $reader): void
    {
        Http::get($gateIp, [ // env var iet kast ip in gudrak tik un ta
            'open' => $reader, // lai veras uz pareizo virzienu abiem jabut vienadiem
            'door' => $reader,
        ]);
    }

    private function OpenBothGate(string $gateIp1, string $gateIp2): void
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

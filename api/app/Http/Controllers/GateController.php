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
            if ($reader == 1) {
                Log::query()->create([
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
            } elseif ($reader == 0 ) {
                Log::query()->create([
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

        }
    }

    public function RequestStatus(Request $request): void
    {
//        foreach ($request->all() as $key => $value) { // debug un ari nekam citam drosvien netiks izmantots
//            error_log($key.': '.$value);
//        }
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

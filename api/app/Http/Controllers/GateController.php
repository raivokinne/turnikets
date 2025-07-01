<?php

namespace App\Http\Controllers;

use App\Models\AccessCredential;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GateController extends Controller
{
    public function RequestCardEvent(Request $request): void
    {
        $card = $request->all()['Card'];
        $access = AccessCredential::query()->where('uuid', $card)->first();
        if ($access) {
            $this->OpenGate($request->all()['IP']);
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

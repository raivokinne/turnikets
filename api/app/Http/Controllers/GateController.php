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
        $access = AccessCredential::query()->where('random_string', $card)->first();
        if ($access) {
            $this->OpenGate($access->door);
        }
    }

    public function RequestStatus(Request $request): void
    {
        foreach ($request->all() as $key => $value) {
            error_log($key.': '.$value);
        }
    }

    private function OpenGate(int $gate): Response
    {
        return Http::get(env(GATE_URL), [
            'open' => 1,
            'door' => $gate,
        ]);
    }

    private function CloseGate(int $gate): Response
    {
        return Http::get(env(GATE_URL), [
            'open' => 0,
            'door' => $gate,
        ]);
    }

    private function OpenBothGate(): void
    {
        Http::get(env(GATE_URL), [
            'open' => 1,
            'door' => 0,
        ]);
        Http::get(env(GATE_URL), [
            'open' => 1,
            'door' => 1,
        ]);
    }

    private function CloseBothGate(): void
    {
        Http::get(env(GATE_URL), [
            'open' => 0,
            'door' => 0,
        ]);
        Http::get(env(GATE_URL), [
            'open' => 0,
            'door' => 1,
        ]);
    }
}

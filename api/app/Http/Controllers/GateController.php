<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GateController extends Controller
    {
        public function RequestCardEvent(Request $request)
        {
            this.OpenGate(0);
            this.OpenGate(1);
           foreach ($request->all() as $key => $value) {
               error_log($key.": ".$value);
           }

        }

        public function RequestStatus(Request $request)
        {
            foreach ($request->all() as $key => $value) {
               error_log($key.": ".$value);
           }
        }

        private function OpenGate(number $gate){
            Http::get(env(GATE_URL), [
                'open' => 1,
                'door' => $gate
            ]);
        }
        private function CloseGate(number $gate){
            Http::get(env(GATE_URL), [
                'open' => 0,
                'door' => $gate
            ]);
        }
        private function OpenBothGate(){
            Http::get(env(GATE_URL), [
                'open' => 1,
                'door' => 0
            ]);
            Http::get(env(GATE_URL), [
                'open' => 1,
                'door' => 1
            ]);
        }
        private function CloseBothGate(){
            Http::get(env(GATE_URL), [
                'open' => 0,
                'door' => 0
            ]);
            Http::get(env(GATE_URL), [
                'open' => 0,
                'door' => 1
            ]);
        }

}

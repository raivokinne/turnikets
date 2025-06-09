<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\JsonResponse;

abstract class Controller
{
    use ValidatesRequests, AuthorizesRequests;

    public function incorrectPayload(mixed $errors): JsonResponse
    {
        return response()->json([
            'status' => 400,
            'message' => 'Incorrect Payload',
            'errors' => $errors
        ], 400);
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $user = User::query()->where('email', $request->email)->first();

        if (!$user || ! Hash::check($request->password, $user->password)) {
            return $this->incorrectPayload(['Wrong password or email']);
        }

        Auth::login($user);
        $token = $user->createToken('auth_12345')->plainTextToken;

        return response()->json([
            'status'  => 200,
            'message' => 'User successfully logged in',
            'token'   => $token,
        ]);
    }


    public function logout(Request $request): Response
    {
        Auth::guard('web')->logout();

        $request->session()->regenerate();

        $request->session()->regenerateToken();

        return response()->noContent();
    }
}


<?php

use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


Route::prefix('/v1')->group(function () {
    Route::prefix('/guest')->group(function () {
        Route::post('/login', [UserController::class, 'login']);
        Route::post('/register', [UserController::class, 'register']);
    });
    Route::prefix('/auth')->middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [UserController::class, 'logout']);
        Route::get('/user', function (Request $request) {
            return $request->user();
        })->middleware('auth:sanctum');

        Route::get('/users', function () {
            return response()->json([
                'status' => 200,
                'message' => 'List of Users',
                'users' => User::all(),
            ]);
        });
    });
});


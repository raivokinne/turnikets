<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('/v1')->group(function () {
    Route::prefix('/guest')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/users', [AuthController::class, 'createUser']);
    });

    Route::prefix('/auth')->middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', function (Request $request) {
            return response()->json([
                'status' => 200,
                'message' => 'User data retrieved successfully',
                'data' => $request->user()
            ]);
        });

        Route::get('/users', function () {
            return response()->json([
                'status' => 200,
                'message' => 'List of Users',
                'data' => User::all(),
            ]);
        });

        Route::post('/profile/update', [AuthController::class, 'updateProfile']);

        Route::post('/email/send', [AuthController::class, 'sendEmail']);
    });

    Route::prefix('/students')->middleware('auth:sanctum')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('/', [StudentController::class, 'store']);
        Route::get('/{id}', [StudentController::class, 'show']);
        Route::put('/{id}', [StudentController::class, 'update']);
        Route::delete('/{id}', [StudentController::class, 'delete']);
    });
});

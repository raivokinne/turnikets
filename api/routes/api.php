<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GateController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\QrCodeController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('AcsDataApi/RequestStatus', [GateController::class, 'RequestStatus']);
Route::post('AcsDataApi/RequestCardEvent', [GateController::class, 'RequestCardEvent']);
Route::post('mass-update', [StudentController::class, 'massUpdate']);

Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('qr-scan', [AuthController::class, 'qrScan']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::group(['prefix' => 'auth'], function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('update-profile', [AuthController::class, 'updateProfile']);
        Route::post('create-user', [AuthController::class, 'createUser']);
        Route::post('send-email', [AuthController::class, 'sendEmail']);
    });

    Route::group(['prefix' => 'qr'], function () {
        Route::post('store', [QrCodeController::class, 'store']);
        Route::post('update', [QrCodeController::class, 'update']);
        Route::get('show', [QrCodeController::class, 'show']);
        Route::delete('destroy', [QrCodeController::class, 'destroy']);
    });

    Route::group(['prefix' => 'students'], function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('store', [StudentController::class, 'store']);
        Route::get('show', [StudentController::class, 'show']);
        Route::post('update', [StudentController::class, 'update']);
        Route::delete('destroy', [StudentController::class, 'destroy']);
        Route::get('by-class', [StudentController::class, 'getByClass']);
        Route::post('update-status', [StudentController::class, 'updateStatus']);
        Route::post('update-student-email', [StudentController::class, 'updateStudentEmail']);
    });

    Route::group(['prefix' => 'logs'], function () {
        Route::get('/', [LogController::class, 'index']);
        Route::get('attendance-summary', [LogController::class, 'getAttendanceSummary']);
        Route::get('user-timeline', [LogController::class, 'getUserTimeline']);
        Route::get('current-occupancy', [LogController::class, 'getCurrentOccupancy']);
    });

    Route::group(['prefix' => 'users'], function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('store', [UserController::class, 'store']);
        Route::get('show', [UserController::class, 'show']);
        Route::post('update', [UserController::class, 'update']);
        Route::delete('destroy', [UserController::class, 'destroy']);
        Route::get('by-role', [UserController::class, 'getUsersByRole']);
        Route::get('stats', [UserController::class, 'getUserStats']);
    });

    Route::get('user', function (Request $request) {
        return $request->user();
    });
});

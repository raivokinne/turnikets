<?php

use App\Http\Controllers\LogController;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    LogController::clearOldLogs();
})->weekly();
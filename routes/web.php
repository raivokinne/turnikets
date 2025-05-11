<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::user()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', fn() => Inertia::render('Auth/Login'))->name('login');
    Route::post('/login', [UserController::class, 'login']);

    Route::get('/register', fn() => Inertia::render('Auth/Register'))->name('register');
    Route::post('/register', [UserController::class, 'register']);

    Route::get('/forgot-password', fn() => Inertia::render('Auth/ForgotPassword'))->name('password.request');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/dashboard', [PageController::class, 'dashboard'])->name('dashboard');
});

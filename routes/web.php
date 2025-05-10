<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::middleware('guest')->group(function () {
    Route::get('/login', fn() => Inertia::render('Auth/Login'))->name('login');
    Route::post('/login', [UserController::class, 'login']);

    Route::get('/register', fn() => Inertia::render('Auth/Register'))->name('register');
    Route::post('/register', [UserController::class, 'register']);

    // Add a password reset route placeholder
    Route::get('/forgot-password', fn() => Inertia::render('Auth/ForgotPassword'))->name('password.request');
});

Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/profile', fn() => Inertia::render('Profile/Edit'))->name('profile');
    Route::get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');
});

<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\Middleware\StartSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\HandleInertiaRequests::class);
        $middleware->append(StartSession::class);
        $middleware->validateCsrfTokens(
            except: [
                '/*',
            ]
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();

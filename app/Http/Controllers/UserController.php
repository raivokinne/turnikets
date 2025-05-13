<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('User/Create.tsx');
    }

    public function store(Request $request): void
    {
        $request->validate();
    }
}

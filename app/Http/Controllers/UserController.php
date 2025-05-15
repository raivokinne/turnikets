<?php

namespace App\Http\Controllers;

use App\Mail\QrCodeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
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
        $request->validate([]);
    }

    public function sendEmail(Request $request, string $id): void
    {
        $validated = Validator::make($request->json()->all(), [
            'to' => 'required|email',
            'name' => 'required|string',
            'attachmentUrl' => 'required|string',
            'class' => 'required|string'
        ]);

        $validated->validate();

        Mail::to(request('to'))->send(new QrCodeMail(request('name'), request('to'), request('attachmentUrl')));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'user' => $request->user()
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'email' => 'required|email'
        ]);

        $user = User::query()->where('email', request('email'))->first();

        $file = $request->file('avatar');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('avatars', $fileName, 'public');

        $user->update([
            'avatar' => $filePath
        ]);

        return Redirect::route('profile')->with('status', 'profile-updated');
    }
}

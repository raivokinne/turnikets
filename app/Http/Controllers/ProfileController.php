<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
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

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->validated();

        $user = User::query()->where('email', request('email'))->first();

        $file = $request->file('avatar');
        $fileName = time() . $request->image->extension();
        $request->image->move(public_path('avatar'), $fileName);

        $user->update([
        ]);

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }
}

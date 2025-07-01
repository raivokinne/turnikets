<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $user = User::query()->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->incorrectPayload(['message' => 'Wrong password or email']);
        }

        Auth::login($user);
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 200,
            'message' => 'User successfully logged in',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 200,
            'message' => 'User successfully logged out',
        ]);
    }

    /**
     * Handle QR code scan for entry/exit
     */
    public function qrScan(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'qr_data' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $decoded_data = base64_decode(urldecode($request->qr_data));
            $user_id = (int) substr($decoded_data, -1);

            $user = User::find($user_id);
            if (! $user) {
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found',
                ], 404);
            }

            $new_status = $user->status === 'klātbutne' ? 'prombutnē' : 'klātbutne';
            $action = $new_status === 'klātbutne' ? 'entry' : 'exit';
            $action_description = $new_status === 'klātbutne' ? 'entered building' : 'left building';

            $user->update(['status' => $new_status]);

            $student = Student::where('user_id', $user->id)->first();
            if ($student) {
                $student->update([
                    'status' => $new_status,
                    'time' => now()->format('H:i:s'),
                ]);
            }

            Log::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => "Student {$action_description} via QR code scan",
                'time' => now(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => "Successfully recorded {$action}",
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'class' => $user->class,
                    'action' => $action,
                    'status' => $new_status,
                    'timestamp' => now()->format('Y-m-d H:i:s'),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to process QR scan',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user profile with avatar
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,'.$request->user()->id,
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $user = $request->user();
        $updateData = [];

        if ($request->hasFile('avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $file = $request->file('avatar');
            $fileName = time().'_'.$file->getClientOriginalName();
            $filePath = $file->storeAs('avatars', $fileName, 'public');
            $updateData['avatar'] = $filePath;
        }

        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }

        if ($request->has('email')) {
            $updateData['email'] = $request->email;
        }

        if (! empty($updateData)) {
            $user->update($updateData);

            Log::create([
                'user_id' => $user->id,
                'action' => 'profile_update',
                'description' => 'User updated profile information',
                'time' => now(),
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $user->fresh(),
                'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null,
            ],
        ]);
    }
}

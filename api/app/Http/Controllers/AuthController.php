<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\QrCodeMail;
use App\Models\AccessCredential;
use App\Models\Student;
use App\Models\User;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
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

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->incorrectPayload(['message' => 'Wrong password or email']);
        }

        Auth::login($user);
        $token = $user->createToken('auth_token')->plainTextToken;

        // Log the login activity
        Log::create([
            'user_id' => $user->id,
            'action' => 'login',
            'description' => 'User logged in via web interface',
            'time' => now()
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'User successfully logged in',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'class' => $user->class,
                'status' => $user->status
            ]
        ]);
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request): JsonResponse
    {
        // Log the logout activity
        Log::create([
            'user_id' => $request->user()->id,
            'action' => 'logout',
            'description' => 'User logged out',
            'time' => now()
        ]);

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
            if (!$user) {
                return response()->json([
                    'status' => 404,
                    'message' => 'User not found'
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
                    'time' => now()->format('H:i:s')
                ]);
            }

            Log::create([
                'user_id' => $user->id,
                'action' => $action,
                'description' => "Student {$action_description} via QR code scan",
                'time' => now()
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
                    'timestamp' => now()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to process QR scan',
                'error' => $e->getMessage()
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
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id
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
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('avatars', $fileName, 'public');
            $updateData['avatar'] = $filePath;
        }

        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }

        if ($request->has('email')) {
            $updateData['email'] = $request->email;
        }

        if (!empty($updateData)) {
            $user->update($updateData);

            Log::create([
                'user_id' => $user->id,
                'action' => 'profile_update',
                'description' => 'User updated profile information',
                'time' => now()
            ]);
        }

        return response()->json([
            'status' => 200,
            'message' => 'Profile updated successfully',
            'data' => [
                'user' => $user->fresh(),
                'avatar_url' => $user->avatar ? Storage::url($user->avatar) : null
            ]
        ]);
    }

    /**
     * Create new user with QR code generation
     */
    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'class' => 'required|string|max:255',
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|in:admin,employee,student'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'class' => $request->class,
                'role' => $request->role ?? 'student',
                'password' => $request->password ? Hash::make($request->password) : null,
                'status' => 'prombutnē'
            ]);

            if ($user->role === 'student') {
                Student::create([
                    'class' => $request->class,
                    'user_id' => $user->id,
                    'time' => now()->format('H:i:s'),
                    'status' => 'prombutnē'
                ]);
            }

            $hex_data = '47455420'  // GET
                . '2F63646F722E6367693F6F70656E3D312664'  // /cdor.cgi?open=1&d
                . '6F6F723D3020485454502F312E310D0A'  // oor=0 HTTP/1.1\r\n
                . '486F73743A203139322E3136382E31332E3233350D0A'  // Host: 192.168.13.235\r\n
                . '417574686F72697A6174696F6E3A20426173696320'  // Authorization: Basic
                . '59574E7430566D6C75364F4467344F4467344F4467340D0A'  // Base64 encoded credentials\r\n
                . '436F6E6E656374696F6E3A20636C6F73650D0A0D0A';  // Connection: close\r\n\r\n

            $qr_data = hex2bin($hex_data) . $user->id;
            $encodedData = urlencode(base64_encode($qr_data));

            $accessCredential = AccessCredential::create([
                'email' => $user->email,
                'qrcode_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . $encodedData . '&margin=30',
                'user_id' => $user->id
            ]);

            Log::create([
                'user_id' => $user->id,
                'action' => 'user_created',
                'description' => "New {$user->role} account created",
                'time' => now()
            ]);

            $emailSent = false;
            $emailMessage = '';

            try {
                Mail::to($user->email)->send(new QrCodeMail(
                    $user->name,
                    $user->email,
                    $accessCredential->qrcode_url,
                ));

                $emailSent = true;
                $emailMessage = 'QR code sent to email successfully';
            } catch (\Exception $e) {
                $emailMessage = 'User created but email failed to send: ' . $e->getMessage();
            }

            return response()->json([
                'status' => 201,
                'message' => 'User created successfully',
                'data' => [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'class' => $user->class,
                    'role' => $user->role,
                    'status' => $user->status,
                    'qrcode_url' => $accessCredential->qrcode_url,
                    'email_sent' => $emailSent,
                    'email_message' => $emailMessage
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method for incorrect payload response
     */
    private function incorrectPayload($errors): JsonResponse
    {
        return response()->json([
            'status' => 422,
            'message' => 'Validation failed',
            'errors' => $errors
        ], 422);
    }
}

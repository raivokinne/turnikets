<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AccessCredential;
use App\Mail\QrCodeMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
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
            'email'    => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $user = User::query()->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->incorrectPayload(['Wrong password or email']);
        }

        Auth::login($user);
        $token = $user->createToken('auth_12345')->plainTextToken;

        return response()->json([
            'status'  => 200,
            'message' => 'User successfully logged in',
            'token'   => $token,
        ]);
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => 200,
            'message' => 'User successfully logged out',
        ]);
    }

    /**
     * Update user profile with avatar
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $user = User::query()->where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'status' => 404,
                'message' => 'User not found'
            ], 404);
        }

        $file = $request->file('avatar');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('avatars', $fileName, 'public');

        $user->update([
            'avatar' => $filePath
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'Profile updated successfully',
            'data' => [
                'avatar_path' => $filePath,
                'avatar_url' => Storage::url($filePath)
            ]
        ]);
    }

    /**
     * Create new user with QR code generation
     */
    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'class' => 'required|string'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $user = User::query()->create([
            'name' => $request->name,
            'email' => $request->email,
            'class' => $request->class,
            'role' => 'student',
        ]);

        // Generate QR code data
        $hex_data = "47455420" . // GET
            "2F63646F722E6367693F6F70656E3D312664" . // /cdor.cgi?open=1&d
            "6F6F723D3020485454502F312E310D0A" . // oor=0 HTTP/1.1\r\n
            "486F73743A203139322E3136382E31332E3233350D0A" . // Host: 192.168.13.235\r\n
            "417574686F72697A6174696F6E3A20426173696320" . // Authorization: Basic
            "59574E7430566D6C75364F4467344F4467344F4467340D0A" . // Base64 encoded credentials\r\n
            "436F6E6E656374696F6E3A20636C6F73650D0A0D0A"; // Connection: close\r\n\r\n

        $qr_data = hex2bin($hex_data) . $user->id;
        $encodedData = urlencode(base64_encode($qr_data));

        $accessCredential = AccessCredential::query()->create([
            'email' => $user->email,
            'qrcode_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . $encodedData . '&margin=30',
            'user_id' => $user->id
        ]);

        // Send email with QR code
        try {
            Mail::to($user->email)->send(new QrCodeMail(
                $user->name,
                $user->email,
                $accessCredential->qrcode_url,
            ));

            $emailSent = true;
            $emailMessage = 'QR code sent to email successfully';
        } catch (\Exception $e) {
            $emailSent = false;
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
                'qrcode_url' => $accessCredential->qrcode_url,
                'email_sent' => $emailSent,
                'email_message' => $emailMessage
            ]
        ], 201);
    }

    /**
     * Send QR code email to user
     */
    public function sendEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to' => 'required|email',
            'name' => 'required|string',
            'attachmentUrl' => 'required|string',
            'class' => 'required|string'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            Mail::to($request->to)->send(new QrCodeMail(
                $request->name,
                $request->to,
                $request->attachmentUrl
            ));

            return response()->json([
                'status' => 200,
                'message' => 'Email sent successfully',
                'data' => [
                    'recipient' => $request->to,
                    'qrcode_url' => $request->attachmentUrl
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to send email',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

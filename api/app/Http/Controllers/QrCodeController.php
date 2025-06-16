<?php

namespace App\Http\Controllers;

use App\Mail\QrCodeMail;
use App\Models\AccessCredential;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use Illuminate\Http\Request;

class QrCodeController extends Controller
{
    /**
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse {
        $user = User::query()->where('email', $request->email)->first();
        $student = Student::query()->where('user_id', $user->id)->first();

        if (!$user || !$student) {
            return response()->json([
                'status' => 404,
                'message' => 'User or student not found'
            ], 404);
        }

        $accessCredential = AccessCredential::query()->create([
            'email' => $user->email,
            'qrcode_url' => $request->attachmentUrl,
            'user_id' => $user->id
        ]);

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
     * @return void
     */
    public function update(Request $request): JsonResponse {
        $accessCredential = AccessCredential::query()->where('id', $request->id)->first();

        if (!$accessCredential) {
            return response()->json([
                'status' => 404,
                'message' => 'Access credential not found'
            ], 404);
        }

        $accessCredential->update([
            'email' => $request->email,
            'qrcode_url' => $request->attachmentUrl
        ]);

        return response()->json([
            'status' => 200,
            'message' => 'Access credential updated successfully'
        ]);
    }
}

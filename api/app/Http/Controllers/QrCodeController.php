<?php

namespace App\Http\Controllers;

use App\Mail\QrCodeMail;
use App\Models\AccessCredential;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class QrCodeController extends Controller
{
    /**
     * Store new QR code credential
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to' => 'required|email|exists:students,email',
            'attachmentUrl' => 'required|url',
            'data' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::where('email', $request->to)->first();

        if (! $student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found',
            ], 404);
        }

        try {
            $accessCredential = AccessCredential::create([
                'email' => $student->email,
                'qrcode_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='.$student->uuid.'&margin=30',
                'student_id' => $student->id,
                'uuid' => $student->uuid,
            ]);

            $emailSent = false;
            $emailMessage = '';

            try {
                Mail::to($student->email)->send(new QrCodeMail(
                    $student->name,
                    $student->email,
                    $accessCredential->qrcode_url,
                ));

                $emailSent = true;
                $emailMessage = 'QR code sent to email successfully';
            } catch (\Exception $e) {
                $emailMessage = 'QR code created but email failed to send: '.$e->getMessage();
            }

            return response()->json([
                'status' => 201,
                'message' => 'QR code credential created successfully',
                'data' => [
                    'student_id' => $student->id,
                    'name' => $student->name,
                    'email' => $student->email,
                    'class' => $student->class,
                    'qrcode_url' => $accessCredential->qrcode_url,
                    'email_sent' => $emailSent,
                    'email_message' => $emailMessage,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create QR code credential',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update existing QR code credential
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:access_credentials,id',
            'email' => 'sometimes|email|exists:users,email',
            'qrcode_url' => 'sometimes|url',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $accessCredential = AccessCredential::query()->find($request->id);

        if (! $accessCredential) {
            return response()->json([
                'status' => 404,
                'message' => 'Access credential not found',
            ], 404);
        }

        try {
            $updateData = [];

            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }

            if ($request->has('qrcode_url')) {
                $updateData['qrcode_url'] = $request->qrcode_url;
            }

            if (! empty($updateData)) {
                $accessCredential->update($updateData);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Access credential updated successfully',
                'data' => $accessCredential->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update access credential',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get QR code credential by user
     */
    public function show(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $accessCredential = AccessCredential::where('user_id', $request->user_id)
            ->with('user')
            ->first();

        if (! $accessCredential) {
            return response()->json([
                'status' => 404,
                'message' => 'Access credential not found',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $accessCredential,
        ]);
    }

    /**
     * Delete QR code credential
     */
    public function destroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:access_credentials,id',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $accessCredential = AccessCredential::find($request->id);

        if (! $accessCredential) {
            return response()->json([
                'status' => 404,
                'message' => 'Access credential not found',
            ], 404);
        }

        $accessCredential->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Access credential deleted successfully',
        ]);
    }
}

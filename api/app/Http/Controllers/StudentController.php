<?php

namespace App\Http\Controllers;

use App\Mail\QrCodeMail;
use App\Models\AccessCredential;
use App\Models\Log;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class StudentController extends Controller {
    public function index(): JsonResponse {
        $students = Student::all();

        return response()->json([
            'success' => true,
            'data' => $students,
        ]);
    }

    /**
     * Create new student
     */
    public function store(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'class' => 'required|string|max:255',
            'status' => 'required|in:klātbūtnē,prombūtnē,neviens',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $student = Student::create([
                'class' => $request->class,
                'status' => $request->status,
                'name' => $request->name,
                'email' => $request->email,
                'time' => now(),
                'uuid' => Str::uuid()->toString(),
            ]);

            $this->sendEmail($student);

            Log::create([
                'student_id' => $student->id,
                'user_id' => Auth::id(),
                'action' => 'student_created',
                'description' => "Student '{$student->name}' created by " . Auth::user()->name,
                'time' => now(),
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Student created successfully',
                'data' => $student,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create student',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update student
     */
    public function update(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
            'class' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:klātbutne,prombutnē',
            'user_id' => 'sometimes|integer|exists:users,id',
            'time' => 'sometimes|date_format:H:i:s',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (! $student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found',
            ], 404);
        }

        try {
            $updateData = [];
            $changes = [];

            if ($request->has('class') && $request->class !== $student->class) {
                $changes[] = "class from '{$student->class}' to '{$request->class}'";
                $updateData['class'] = $request->class;
            }

            if ($request->has('status') && $request->status !== $student->status) {
                $changes[] = "status from '{$student->status}' to '{$request->status}'";
                $updateData['status'] = $request->status;
            }

            if ($request->has('user_id')) {
                $existingStudent = Student::where('user_id', $request->user_id)
                    ->where('id', '!=', $student->id)
                    ->first();

                if ($existingStudent) {
                    return response()->json([
                        'status' => 409,
                        'message' => 'Another student record already exists for this user',
                    ], 409);
                }

                if ($request->user_id !== $student->user_id) {
                    $changes[] = "user_id from '{$student->user_id}' to '{$request->user_id}'";
                    $updateData['user_id'] = $request->user_id;
                }
            }

            if ($request->has('time') && $request->time !== $student->time) {
                $changes[] = "time from '{$student->time}' to '{$request->time}'";
                $updateData['time'] = $request->time;
            }

            if (! empty($updateData)) {
                $student->update($updateData);

                Log::create([
                    'student_id' => $student->id,
                    'user_id' => Auth::id(),
                    'action' => 'student_updated',
                    'description' => "Student '{$student->name}' updated by " . Auth::user()->name . '. Changes: ' . implode(', ', $changes),
                    'time' => now(),
                ]);
            }

            $student->save();

            return response()->json([
                'status' => 200,
                'message' => 'Student updated successfully',
                'data' => $student->fresh()->load('user'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update student',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete student
     */
    public function destroy(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (! $student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found',
            ], 404);
        }

        try {
            $studentName = $student->name;
            $studentId = $student->id;

            $existsAccess = AccessCredential::query()->where('student_id', $student->id)->get();
            foreach ($existsAccess as $as) {
                $as->delete();
            }

            Log::create([
                'student_id' => $studentId,
                'user_id' => Auth::id(),
                'action' => 'student_deleted',
                'description' => "Student '{$studentName}' deleted by " . Auth::user()->name,
                'time' => now(),
            ]);

            $student->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Student deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete student',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update student status
     */
    public function updateStatus(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
            'status' => 'required|in:klātbutne,prombutnē',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (! $student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found',
            ], 404);
        }

        try {
            $oldStatus = $student->status;

            $student->update([
                'status' => $request->status,
                'time' => now()->format('H:i:s'),
            ]);

            Log::create([
                'student_id' => $student->id,
                'user_id' => Auth::id(),
                'action' => 'student_updated',
                'description' => "Student '{$student->name}' status updated by " . Auth::user()->name . " from '{$oldStatus}' to '{$request->status}'",
                'time' => now(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Student status updated successfully',
                'data' => $student->fresh()->load('user'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update student status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateStudentEmail(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
            'email' => 'required|email|max:255',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (! $student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found',
            ], 404);
        }

        try {
            $oldEmail = $student->email;

            $student->update([
                'email' => $request->email,
            ]);

            Log::create([
                'student_id' => $student->id,
                'user_id' => Auth::id(),
                'action' => 'student_updated',
                'description' => "Student '{$student->name}' email updated by " . Auth::user()->name . " from '{$oldEmail}' to '{$request->email}'",
                'time' => now(),
            ]);

            $this->sendEmail($student);

            return response()->json([
                'status' => 200,
                'message' => 'Student email updated successfully',
                'data' => $student,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update student email',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function massUpdate(Request $request): JsonResponse {
        try {
            if (! $request->has('data') || ! is_array($request->input('data'))) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Invalid data format. Expected "data" array.',
                    'received' => $request->all(),
                ], 400);
            }

            $data = $request->input('data');
            $createdStudents = [];
            $errors = [];

            foreach ($data as $index => $studentData) {
                $insertData = [
                    'status' => 'prombūtnē',
                    'name'   => trim($studentData['name'] ?? ''),
                    'email'  => trim($studentData['email'] ?? ''),
                    'class'  => trim($studentData['group'] ?? ''),
                    'uuid'   => Str::uuid()->toString(),
                    'time'   => now(),
                ];

                if ($insertData['email'] === '') {
                    $errors[] = "Row $index: Missing email";
                    continue;
                }

                $exists = Student::query()->where('email', $insertData['email'])->first();

                if ($exists) {
                    $errors[] = "Row $index: Student with email {$insertData['email']} already exists";
                    continue;
                }

                $student = Student::query()->create($insertData);
                $createdStudents[] = $student;
            }

            Log::create([
                'student_id'  => null,
                'user_id'     => Auth::id(),
                'action'      => 'mass_student_upload',
                'description' => 'Mass student upload by ' . (Auth::user()->name ?? 'system') .
                    '. Created: ' . count($createdStudents) .
                    ', Errors: ' . count($errors) .
                    ', Total processed: ' . count($data),
                'time' => now(),
            ]);

            return response()->json([
                'status'  => 200,
                'message' => count($createdStudents) . ' students uploaded successfully',
                'errors'  => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 500,
                'message' => 'Failed to retrieve students',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }


    private function sendEmail(Student $student): void {
        try {
            $accessCredential = AccessCredential::create([
                'email' => $student->email,
                'student_id' => $student->id,
                'qrcode_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' . urlencode(base64_encode('474554202F63646F722E6367693F6F70656E3D3126646F6F723D3020485454502F312E310D0A486F73743A203139322E3136382E31332E3233350D0A417574686F72697A6174696F6E3A2042617369632059574E7430566D6C75364F4467344F4467344F4467340D0A436F6E6E656374696F6E3A20636C6F73650D0A0D0A436F6E6E656374696F6E3A20636C6F73650D0A0D0A')) . '&margin=30',
                'uuid' => $student->uuid,
            ]);

            Mail::to($student->email)->send(new QrCodeMail(
                $student->name,
                $student->email,
                $accessCredential->qrcode_url,
            ));
        } catch (\Exception $e) {
            Log::create([
                'student_id' => $student->id,
                'user_id' => Auth::id(),
                'action' => 'email_send_failed',
                'description' => 'Failed to send email to student',
                'time' => now(),
            ]);
        }
    }
}

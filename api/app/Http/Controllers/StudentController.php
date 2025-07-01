<?php

namespace App\Http\Controllers;

use App\Mail\QrCodeMail;
use App\Models\AccessCredential;
use App\Models\Log;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class StudentController extends Controller
{
    /**
     * Get all students
     */
    public function index(): JsonResponse
    {
        try {
            $students = Student::with('user')->get();

            return response()->json([
                'status' => 200,
                'data' => $students,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new student
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'class' => 'required|string|max:255',
            'status' => 'required|in:klātbutne,prombutnē,gaida',
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
                'time' => now()->format('H:i:s'),
            ]);

            Log::create([
                'student_id' => $student->id,
                'action' => 'student_created',
                'description' => 'Student created',
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
     * Get student by ID
     */
    public function show(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::with('user')->find($request->id);

        if (! $student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found',
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $student,
        ]);
    }

    /**
     * Update student
     */
    public function update(Request $request): JsonResponse
    {
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

            if ($request->has('class')) {
                $updateData['class'] = $request->class;
            }

            if ($request->has('status')) {
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

                $updateData['user_id'] = $request->user_id;
            }

            if ($request->has('time')) {
                $updateData['time'] = $request->time;
            }

            if (! empty($updateData)) {
                $student->update($updateData);
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
    public function destroy(Request $request): JsonResponse
    {
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
            $existsAccess = AccessCredential::query()->where('student_id', $student->id)->get();
            foreach ($existsAccess as $as) {
                $as->delete();
            }
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
     * Get students by class
     */
    public function getByClass(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'class' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $students = Student::with('user')
                ->where('class', $request->class)
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $students,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update student status
     */
    public function updateStatus(Request $request): JsonResponse
    {
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
            $student->update([
                'status' => $request->status,
                'time' => now()->format('H:i:s'),
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

    private function sendEmail(Student $student): void
    {
        try {
            $accessCredential = AccessCredential::create([
                'email' => $student->email,
                'student_id' => $student->id,
                'qrcode_url' => 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='.urlencode(base64_encode('474554202F63646F722E6367693F6F70656E3D3126646F6F723D3020485454502F312E310D0A486F73743A203139322E3136382E31332E3233350D0A417574686F72697A6174696F6E3A2042617369632059574E7430566D6C75364F4467344F4467344F4467340D0A436F6E6E656374696F6E3A20636C6F73650D0A0D0A436F6E6E656374696F6E3A20636C6F73650D0A0D0A')).'&margin=30',
                'random_string' => Str::random(16),
            ]);

            Mail::to($student->email)->send(new QrCodeMail(
                $student->name,
                $student->email,
                $accessCredential->qrcode_url,
            ));
        } catch (\Exception $e) {
            Log::create([
                'student_id' => $student->id,
                'action' => 'email_send_failed',
                'description' => 'Failed to send email to student',
                'time' => now(),
            ]);
        }
    }

    public function updateStudentEmail(Request $request): JsonResponse
    {
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
            $student->update([
                'email' => $request->email,
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

    public function massUpdate(Request $request)
    {
        try {
            foreach ($request->data as $st) {
                $name = $st['name'];
                $email = $st['email'];

                $student = Student::query()->create([
                    'name' => $name,
                    'email' => $email,
                ]);

                $this->sendEmail($student);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Student uploaded',
                'data' => $student,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to upload students',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

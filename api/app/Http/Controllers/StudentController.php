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
                    'description' => "Student '{$student->name}' updated by " . Auth::user()->name . 'Changes: ' . implode(', ', $changes),
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
            // Store student data before deletion
            $studentName = $student->name;
            $studentId = $student->id;
            $studentEmail = $student->email;
            $studentClass = $student->class;

            // Create deletion log BEFORE deleting the student
            Log::create([
                'student_id' => null, // Set to null since student will be deleted
                'user_id' => Auth::id(),
                'action' => 'student_deleted',
                'description' => "Student '{$studentName}' (ID: {$studentId}, Email: {$studentEmail}, Class: {$studentClass}) deleted by " . Auth::user()->name,
                'time' => now(),
            ]);

            // Update existing logs to preserve them by setting student_id to null
            // This prevents cascade deletion and keeps the historical record
            Log::where('student_id', $studentId)->update([
                'student_id' => null,
                'description' => \DB::raw("'[DELETED STUDENT: {$studentName} (ID: {$studentId})] ' || description")
            ]);

            // Delete access credentials
            AccessCredential::where('student_id', $student->id)->delete();

            // Finally delete the student
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

    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id',
            'email' => 'required|email|max:255',
            'name' => 'required|string|max:255',
            'class' => 'required|string|max:255',
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
            $oldData = $student;

            $student->update([
                'email' => $request->email,
                'name' => $request->name,
                'class' => $request->class,
            ]);

            Log::create([
                'student_id' => $student->id,
                'user_id' => Auth::id(),
                'action' => 'student_updated',
                'description' => "Student '{$student->name}' updated by ".Auth::user()->name." from '{$oldData->email}', '{$oldData->name}', '{$oldData->class}' to '{$request->email}', '{$request->name}', '{$request->class}'",
                'time' => now(),
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Student updated successfully',
                'data' => $student,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update student data',
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
                $uuid = isset($studentData['qr_code']) && !empty(trim($studentData['qr_code']))
                    ? trim($studentData['qr_code'])
                    : Str::uuid()->toString();

                $insertData = [
                    'status' => 'neviens',
                    'name'   => trim($studentData['name'] ?? ''),
                    'email'  => trim($studentData['email'] ?? ''),
                    'class'  => trim($studentData['group'] ?? ''),
                    'uuid'   => $uuid,
                    'time'   => now(),
                ];

                if ($insertData['email'] === '') {
                    $errors[] = "Row $index: Missing email";
                    continue;
                }

                $emailExists = Student::query()->where('email', $insertData['email'])->first();
                if ($emailExists) {
                    $errors[] = "Row $index: Student with email {$insertData['email']} already exists";
                    continue;
                }

                $uuidExists = Student::query()->where('uuid', $uuid)->first();
                if ($uuidExists) {
                    $errors[] = "Row $index: Student with QR Code/UUID {$uuid} already exists";
                    continue;
                }

                try {
                    $student = Student::query()->create($insertData);
                    $createdStudents[] = $student;
                } catch (\Exception $e) {
                    $errors[] = "Row $index: Failed to create student - " . $e->getMessage();
                }
            }

            $employeeId = $request->input('employee_id') ?? Auth::id();
            $employeeName = 'system';

            if ($employeeId && $employeeId == Auth::id()) {
                $employeeName = Auth::user()->name ?? 'system';
            } elseif ($employeeId) {
                $employee = \App\Models\User::find($employeeId);
                $employeeName = $employee ? $employee->name : "Employee ID: $employeeId";
            }

            Log::create([
                'student_id'  => null,
                'user_id'     => $employeeId,
                'action'      => 'mass_student_upload',
                'description' => "Mass upload by {$employeeName}. Created: " . count($createdStudents) .
                    ', Errors: ' . count($errors) .
                    ', Total processed: ' . count($data),
                'time' => now(),
            ]);

            return response()->json([
                'status'  => 200,
                'message' => count($createdStudents) . ' students uploaded successfully',
                'created' => count($createdStudents),
                'errors'  => $errors,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 500,
                'message' => 'Failed to process mass upload',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}

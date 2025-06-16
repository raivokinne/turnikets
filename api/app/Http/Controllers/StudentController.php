<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

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
                'data' => $students
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve students',
                'error' => $e->getMessage()
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
            'status' => 'required|in:klātbutne,prombutnē',
            'user_id' => 'required|integer|exists:users,id',
            'time' => 'sometimes|date_format:H:i:s'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        // Check if student already exists for this user
        $existingStudent = Student::where('user_id', $request->user_id)->first();

        if ($existingStudent) {
            return response()->json([
                'status' => 409,
                'message' => 'Student record already exists for this user'
            ], 409);
        }

        try {
            $student = Student::create([
                'class' => $request->class,
                'status' => $request->status,
                'user_id' => $request->user_id,
                'time' => $request->time ?? now()->format('H:i:s')
            ]);

            return response()->json([
                'status' => 201,
                'message' => 'Student created successfully',
                'data' => $student->load('user')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student by ID
     */
    public function show(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::with('user')->find($request->id);

        if (!$student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found'
            ], 404);
        }

        return response()->json([
            'status' => 200,
            'data' => $student
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
            'time' => 'sometimes|date_format:H:i:s'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (!$student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found'
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
                // Check if another student already exists for this user
                $existingStudent = Student::where('user_id', $request->user_id)
                    ->where('id', '!=', $student->id)
                    ->first();

                if ($existingStudent) {
                    return response()->json([
                        'status' => 409,
                        'message' => 'Another student record already exists for this user'
                    ], 409);
                }

                $updateData['user_id'] = $request->user_id;
            }

            if ($request->has('time')) {
                $updateData['time'] = $request->time;
            }

            if (!empty($updateData)) {
                $student->update($updateData);
            }

            return response()->json([
                'status' => 200,
                'message' => 'Student updated successfully',
                'data' => $student->fresh()->load('user')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete student
     */
    public function destroy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:students,id'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (!$student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found'
            ], 404);
        }

        try {
            $student->delete();

            return response()->json([
                'status' => 200,
                'message' => 'Student deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get students by class
     */
    public function getByClass(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'class' => 'required|string'
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
                'data' => $students
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve students',
                'error' => $e->getMessage()
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
            'status' => 'required|in:klātbutne,prombutnē'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::find($request->id);

        if (!$student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found'
            ], 404);
        }

        try {
            $student->update([
                'status' => $request->status,
                'time' => now()->format('H:i:s')
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'Student status updated successfully',
                'data' => $student->fresh()->load('user')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update student status',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


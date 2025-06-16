<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StudentController extends Controller
{
    public function index(): JsonResponse {
        $students = Student::with('user')->get();

        return response()->json($students);
    }

    public function store(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'class' => 'required|string',
            'status' => 'required|string',
            'user_id' => 'required|integer'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $student = Student::create([
            'class' => $request->class,
            'status' => $request->status,
            'user_id' => $request->user_id
        ]);

        return response()->json($student);
    }

    public function show(Request $request): JsonResponse {
        $student = Student::with('user')->find($request->id);

        if (!$student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found'
            ], 404);
        }

        return response()->json($student);
    }

    public function update(Request $request): JsonResponse {
        $validator = Validator::make($request->all(), [
            'id' => 'required|integer',
            'class' => 'required|string',
            'status' => 'required|string',
            'user_id' => 'required|integer'
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

        $student->update([
            'class' => $request->class,
            'status' => $request->status,
            'user_id' => $request->user_id
        ]);

        return response()->json($student);
    }

    public function delete(Request $request): JsonResponse {
        $student = Student::find($request->id);

        if (!$student) {
            return response()->json([
                'status' => 404,
                'message' => 'Student not found'
            ], 404);
        }

        $student->delete();

        return response()->json([
            'status' => 200,
            'message' => 'Student deleted successfully'
        ]);
    }
}

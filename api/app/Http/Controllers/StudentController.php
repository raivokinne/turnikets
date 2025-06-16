<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index() {
        $students = Student::with('user')->get();

        return response()->json($students);
    }

    public function store(Request $request) {}
}

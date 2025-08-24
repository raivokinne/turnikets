<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class LogController extends Controller
{
    /**
     * Get all logs with filtering options
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'sometimes|integer|exists:students,id',
            'user_id' => 'sometimes|integer|exists:users,id',
            'action' => 'sometimes|string|in:login,logout,entry,exit,profile_update,user_created,user_updated,user_deleted,student_created,student_updated,student_deleted,mass_student_upload,email_send_failed',
            'date' => 'sometimes|date_format:Y-m-d',
            'start_date' => 'sometimes|date_format:Y-m-d',
            'end_date' => 'sometimes|date_format:Y-m-d',
            'class' => 'sometimes|string',
            'per_page' => 'sometimes|integer|min:1|max:5000' // Increased limit for reports
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $query = Log::with(['student', 'user']);

            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            if ($request->has('date')) {
                $query->whereDate('time', $request->date);
            }

            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('time', [
                    $request->start_date . ' 00:00:00',
                    $request->end_date . ' 23:59:59'
                ]);
            }

            if ($request->has('class')) {
                $query->whereHas('student', function($q) use ($request) {
                    $q->where('class', $request->class);
                });
            }

            $query->where('hidden', '!=', true);

            $perPage = $request->get('per_page', 50);
            if (Auth::user()->role === 'admin') {
                $logs = $query->orderBy('time', 'desc')->paginate($perPage);
            } else {
                $logs = $query->whereIn('action', ['entry', 'exit'])->orderBy('time', 'desc')->paginate($perPage);
            }

            $logs->getCollection()->transform(function ($log) {
                $details = null;
                if ($log->details) {
                    try {
                        $details = json_decode($log->details, true);
                    } catch (\Exception $e) {
                        $details = null;
                    }
                }

                $log->performed_by_user = null;
                if ($log->user) {
                    $log->performed_by_user = [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                        'role' => $log->user->role
                    ];
                } elseif ($details && isset($details['performed_by'])) {
                    $log->performed_by_user = [
                        'name' => $details['performed_by']
                    ];
                }

                $log->parsed_details = $details;
                return $log;
            });

            return response()->json([
                'status' => 200,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get logs for reports - no pagination limits
     */
    public function getReportData(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date_format:Y-m-d',
            'end_date' => 'required|date_format:Y-m-d',
            'action' => 'sometimes|string|in:login,logout,entry,exit,profile_update,user_created,user_updated,user_deleted,student_created,student_updated,student_deleted,mass_student_upload,email_send_failed',
            'class' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $query = Log::with(['student', 'user'])
                ->whereBetween('time', [
                    $request->start_date . ' 00:00:00',
                    $request->end_date . ' 23:59:59'
                ])
                ->where('hidden', '!=', true);

            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            if ($request->has('class')) {
                $query->whereHas('student', function($q) use ($request) {
                    $q->where('class', $request->class);
                });
            }

            // Filter by user role if not admin
            if (Auth::user()->role !== 'admin') {
                $query->whereIn('action', ['entry', 'exit']);
            }

            // Get ALL logs without pagination for reports
            $logs = $query->orderBy('time', 'desc')->get();

            $logs->transform(function ($log) {
                $details = null;
                if ($log->details) {
                    try {
                        $details = json_decode($log->details, true);
                    } catch (\Exception $e) {
                        $details = null;
                    }
                }

                $log->performed_by_user = null;
                if ($log->user) {
                    $log->performed_by_user = [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'email' => $log->user->email,
                        'role' => $log->user->role
                    ];
                } elseif ($details && isset($details['performed_by'])) {
                    $log->performed_by_user = [
                        'name' => $details['performed_by']
                    ];
                }

                $log->parsed_details = $details;
                return $log;
            });

            return response()->json([
                'status' => 200,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve report data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get attendance summary for a specific date
     */
    public function getAttendanceSummary(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|date_format:Y-m-d',
            'class' => 'sometimes|string'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $date = $request->get('date', now()->format('Y-m-d'));

        try {
            $query = Log::with('student')
                ->whereDate('time', $date)
                ->whereIn('action', ['entry', 'exit'])
                ->where('hidden', '!=', true);

            if ($request->has('class')) {
                $query->whereHas('student', function($q) use ($request) {
                    $q->where('class', $request->class);
                });
            }

            $logs = $query->orderBy('time', 'asc')->get();

            $attendance = [];
            foreach ($logs as $log) {
                $studentId = $log->student_id;
                if (!isset($attendance[$studentId])) {
                    $attendance[$studentId] = [
                        'student' => $log->student,
                        'entries' => [],
                        'exits' => [],
                        'total_time' => 0,
                        'status' => 'absent'
                    ];
                }

                if ($log->action === 'entry') {
                    $attendance[$studentId]['entries'][] = $log->time;
                    $attendance[$studentId]['status'] = 'present';
                } else {
                    $attendance[$studentId]['exits'][] = $log->time;
                }
            }

            foreach ($attendance as &$record) {
                $totalMinutes = 0;
                $entryCount = count($record['entries']);
                $exitCount = count($record['exits']);

                for ($i = 0; $i < min($entryCount, $exitCount); $i++) {
                    $entry = Carbon::parse($record['entries'][$i]);
                    $exit = Carbon::parse($record['exits'][$i]);
                    $totalMinutes += $entry->diffInMinutes($exit);
                }

                $record['total_time'] = $totalMinutes;
                $record['total_time_formatted'] = sprintf('%02d:%02d',
                    floor($totalMinutes / 60),
                    $totalMinutes % 60
                );
            }

            return response()->json([
                'status' => 200,
                'data' => [
                    'date' => $date,
                    'attendance' => array_values($attendance),
                    'summary' => [
                        'total_students' => count($attendance),
                        'present_students' => count(array_filter($attendance, function($a) {
                            return $a['status'] === 'present';
                        }))
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to generate attendance summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user activity timeline
     */
    public function getUserTimeline(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|integer|exists:students,id',
            'date' => 'sometimes|date_format:Y-m-d'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $date = $request->get('date', now()->format('Y-m-d'));

        try {
            $logs = Log::with('student')
                ->where('student_id', $request->student_id)
                ->whereDate('time', $date)
                ->where('hidden', '!=', true)
                ->orderBy('time', 'asc')
                ->get();

            $student = Student::find($request->student_id);

            return response()->json([
                'status' => 200,
                'data' => [
                    'student' => $student,
                    'date' => $date,
                    'timeline' => $logs
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve user timeline',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current building occupancy
     */
    public function getCurrentOccupancy(): JsonResponse
    {
        try {
            $presentStudents = Student::where('status', 'klātbutne')
                ->with(['logs' => function($query) {
                    $query->whereDate('time', now())
                        ->where('action', 'entry')
                        ->where('hidden', '!=', true)
                        ->latest();
                }])
                ->get();

            $occupancyByClass = $presentStudents->groupBy('class')->map(function($students, $class) {
                return [
                    'class' => $class,
                    'count' => $students->count(),
                    'students' => $students->map(function($student) {
                        return [
                            'id' => $student->id,
                            'name' => $student->name,
                            'last_entry' => $student->logs->first() ? $student->logs->first()->time : null
                        ];
                    })
                ];
            });

            return response()->json([
                'status' => 200,
                'data' => [
                    'total_present' => $presentStudents->count(),
                    'by_class' => $occupancyByClass->values(),
                    'last_updated' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to get current occupancy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark as deleted what's older than 2 weeks
     */
    public function clearOldLogs(): JsonResponse
    {
        try {
            $oldLogs = Log::where('time', '<', now()->subWeeks(2));
            $count = $oldLogs->count();

            $oldLogs->update(['hidden' => true]);

            return response()->json([
                'status' => 200,
                'message' => "Successfully marked {$count} old logs as hidden"
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to clear old logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method for incorrect payload response
     */
    public function incorrectPayload($errors): JsonResponse
    {
        return response()->json([
            'status' => 422,
            'message' => 'Validation failed',
            'errors' => $errors
        ], 422);
    }
}

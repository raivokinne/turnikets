<?php

namespace App\Http\Controllers;

use App\Models\Log;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
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
            'action' => 'sometimes|string|in:login,logout,entry,exit,profile_update,user_created',
            'date' => 'sometimes|date_format:Y-m-d',
            'start_date' => 'sometimes|date_format:Y-m-d',
            'end_date' => 'sometimes|date_format:Y-m-d',
            'class' => 'sometimes|string',
            'per_page' => 'sometimes|integer|min:1|max:100'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $query = Log::with('student');

            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
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

            $perPage = $request->get('per_page', 50);
            $logs = $query->orderBy('time', 'desc')->paginate($perPage);

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
                ->whereIn('action', ['entry', 'exit']);

            if ($request->has('class')) {
                $query->whereHas('user', function($q) use ($request) {
                    $q->where('class', $request->class);
                });
            }

            $logs = $query->orderBy('time', 'asc')->get();

            $attendance = [];
            foreach ($logs as $log) {
                $userId = $log->student_id;
                if (!isset($attendance[$userId])) {
                    $attendance[$userId] = [
                        'student' => $log->student,
                        'entries' => [],
                        'exits' => [],
                        'total_time' => 0,
                        'status' => 'absent'
                    ];
                }

                if ($log->action === 'entry') {
                    $attendance[$userId]['entries'][] = $log->time;
                    $attendance[$userId]['status'] = 'present';
                } else {
                    $attendance[$userId]['exits'][] = $log->time;
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
            'user_id' => 'required|integer|exists:users,id',
            'date' => 'sometimes|date_format:Y-m-d'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        $date = $request->get('date', now()->format('Y-m-d'));

        try {
            $logs = Log::with('user')
                ->where('user_id', $request->user_id)
                ->whereDate('time', $date)
                ->orderBy('time', 'asc')
                ->get();

            $user = User::find($request->user_id);

            return response()->json([
                'status' => 200,
                'data' => [
                    'user' => $user,
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
            $presentUsers = User::where('status', 'klātbutne')
                ->where('role', 'student')
                ->with(['logs' => function($query) {
                    $query->whereDate('time', now())
                        ->where('action', 'entry')
                        ->latest();
                }])
                ->get();

            $occupancyByClass = $presentUsers->groupBy('class')->map(function($users, $class) {
                return [
                    'class' => $class,
                    'count' => $users->count(),
                    'students' => $users->map(function($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'last_entry' => $user->logs->first() ? $user->logs->first()->time : null
                        ];
                    })
                ];
            });

            return response()->json([
                'status' => 200,
                'data' => [
                    'total_present' => $presentUsers->count(),
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
}

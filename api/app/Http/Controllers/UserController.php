<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users with filtering options (Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'sometimes|string|in:admin,employee',
            'class' => 'sometimes|string',
            'search' => 'sometimes|string',
            'per_page' => 'sometimes|integer|min:1|max:100'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $query = User::query();

            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            if ($request->has('class')) {
                $query->where('class', $request->class);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

            $users->getCollection()->transform(function ($user) {
                unset($user->password, $user->remember_token);
                return $user;
            });

            return response()->json([
                'status' => 200,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new user (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role' => 'required|string|in:admin,employee',
            'class' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8|confirmed',
            'avatar' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'role' => $request->role,
                'class' => $request->class,
                'avatar' => $request->avatar,
                'uuid' => Str::uuid(),
                'password' => $request->password ? Hash::make($request->password) : null,
            ];

            $user = User::create($userData);

            Log::create([
                'user_id' => Auth::id(),
                'action' => 'user_created',
                'details' => json_encode([
                    'created_user_id' => $user->id,
                    'created_user_name' => $user->name,
                    'created_user_email' => $user->email,
                    'created_user_role' => $user->role
                ]),
                'time' => now()
            ]);

            unset($user->password, $user->remember_token);

            return response()->json([
                'status' => 201,
                'message' => 'User created successfully',
                'data' => $user
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a specific user (Admin only)
     */
    public function show(Request $request): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $user = User::find($request->id);

            unset($user->password, $user->remember_token);

            return response()->json([
                'status' => 200,
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a user (Admin only)
     */
    public function update(Request $request): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $rules = [
            'id' => 'required|integer|exists:users,id',
        ];

        if ($request->has('name')) {
            $rules['name'] = 'string|max:255';
        }

        if ($request->has('email')) {
            $rules['email'] = ['string', 'email', 'max:255', Rule::unique('users')->ignore($request->id)];
        }

        if ($request->has('role')) {
            $rules['role'] = 'string|in:admin,employee';
        }

        if ($request->has('class')) {
            $rules['class'] = 'nullable|string|max:255';
        }

        if ($request->has('avatar')) {
            $rules['avatar'] = 'nullable|string|max:255';
        }

        if ($request->has('password') && !empty($request->password)) {
            $rules['password'] = 'string|min:8|confirmed';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $user = User::find($request->id);
            $originalData = $user->toArray();

            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('email')) {
                $user->email = $request->email;
            }
            if ($request->has('role')) {
                $user->role = $request->role;
            }
            if ($request->has('class')) {
                $user->class = $request->class;
            }
            if ($request->has('avatar')) {
                $user->avatar = $request->avatar;
            }

            if ($request->has('password') && !empty($request->password)) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            Log::create([
                'user_id' => Auth::id(),
                'action' => 'user_updated',
                'details' => json_encode([
                    'updated_user_id' => $user->id,
                    'updated_user_name' => $user->name,
                    'changes' => $request->only(['name', 'email', 'role', 'class', 'avatar'])
                ]),
                'time' => now()
            ]);

            unset($user->password, $user->remember_token);

            return response()->json([
                'status' => 200,
                'message' => 'User updated successfully',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user (Admin only)
     */
    public function destroy(Request $request): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'id' => 'required|integer|exists:users,id'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $user = User::find($request->id);

            if ($user->id === Auth::id()) {
                return response()->json([
                    'status' => 400,
                    'message' => 'Cannot delete your own account'
                ], 400);
            }

            $userData = $user->toArray();
            $user->delete();

            Log::create([
                'user_id' => Auth::id(),
                'action' => 'user_deleted',
                'details' => json_encode([
                    'deleted_user_id' => $userData['id'],
                    'deleted_user_name' => $userData['name'],
                    'deleted_user_email' => $userData['email'],
                    'deleted_user_role' => $userData['role']
                ]),
                'time' => now()
            ]);

            return response()->json([
                'status' => 200,
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users by role (Admin only)
     */
    public function getUsersByRole(Request $request): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'required|string|in:admin,employee'
        ]);

        if ($validator->fails()) {
            return $this->incorrectPayload($validator->errors());
        }

        try {
            $users = User::where('role', $request->role)
                ->select('id', 'name', 'email', 'role', 'class', 'avatar', 'created_at')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => $users
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve users by role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user statistics (Admin only)
     */
    public function getUserStats(): JsonResponse
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json([
                'status' => 403,
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $totalUsers = User::count();
            $adminUsers = User::where('role', 'admin')->count();
            $employeeUsers = User::where('role', 'employee')->count();
            $recentUsers = User::where('created_at', '>=', now()->subDays(7))->count();

            $usersByClass = User::whereNotNull('class')
                ->selectRaw('class, COUNT(*) as count')
                ->groupBy('class')
                ->orderBy('count', 'desc')
                ->get();

            return response()->json([
                'status' => 200,
                'data' => [
                    'total_users' => $totalUsers,
                    'admin_users' => $adminUsers,
                    'employee_users' => $employeeUsers,
                    'recent_users' => $recentUsers,
                    'users_by_class' => $usersByClass
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'message' => 'Failed to retrieve user statistics',
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

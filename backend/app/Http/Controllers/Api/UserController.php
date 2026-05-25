<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['creator:id,name', 'updater:id,name']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->role) {
            $query->where('role', $request->role);
        }

        $sortable = ['name', 'email', 'created_at'];
        $sortBy  = in_array($request->sort_by, $sortable) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        $paginated = $query->paginate(20);

        return response()->json(array_merge(
            $paginated->toArray(),
            ['total' => $paginated->total()]
        ));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'title'    => 'nullable|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|in:admin,staff',
        ]);

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        AuditService::log('created', "Created user {$user->name}", $user, [], $user->makeHidden(['password'])->toArray());

        return response()->json($user->makeHidden(['password']), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->makeHidden(['password']));
    }

    public function update(Request $request, User $user)
    {
        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Super admin accounts cannot be modified through the dashboard.'], 403);
        }
        $data = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'title'    => 'nullable|string|max:100',
            'email'    => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role'     => 'sometimes|required|in:admin,staff',
        ]);

        $old = $user->makeHidden(['password'])->toArray();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        AuditService::log('updated', "Updated user {$user->name}", $user, $old, $user->fresh()->makeHidden(['password'])->toArray());

        return response()->json($user->fresh()->makeHidden(['password']));
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Super admin accounts cannot be deleted through the dashboard.'], 403);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 403);
        }

        AuditService::log('deleted', "Deleted user {$user->name}", $user);

        $user->delete();

        return response()->json(null, 204);
    }
}

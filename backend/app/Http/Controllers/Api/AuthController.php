<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        $token = $user->createToken('headoffice')->plainTextToken;

        AuditService::log('login', 'User logged in');

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function logout(Request $request)
    {
        AuditService::log('logout', 'User logged out');
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function updatePreferences(Request $request)
    {
        $data = $request->validate([
            'theme_mode' => 'required|in:dark,light',
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'  => 'required|string|max:255',
            'title' => 'nullable|string|max:100',
            'email' => ['required', 'email', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);
        AuditService::log('updated', 'Updated own profile', $user);

        return response()->json($user->fresh());
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password'      => 'required',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);
        AuditService::log('updated', 'Changed own password', $user);

        return response()->json(['message' => 'Password changed successfully.']);
    }
}

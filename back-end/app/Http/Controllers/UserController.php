<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users (admin only)
     */
    public function getAllUsers()
    {
        $users = User::all();
        return response()->json($users);
    }

    /**
     * Create a new member (admin only)
     */
    public function createMember(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:admin,member'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'member',
        ]);

        return response()->json([
            'message' => 'Member created successfully',
            'user' => $user
        ], 201);
    }

    /**
     * Update user role (admin only)
     */
    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:admin,member'
        ]);

        $user = User::findOrFail($id);

        // Prevent changing own role
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot change your own role'], 403);
        }

        $user->role = $request->role;
        $user->save();

        return response()->json([
            'message' => 'User role updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Delete user (admin only)
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Update user information
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($id)
            ],
            'role' => 'required|in:admin,member'
        ]);

        $user = User::findOrFail($id);

        // Prevent changing own role
        if ($user->id === $request->user()->id && $request->role !== $user->role) {
            return response()->json(['message' => 'Cannot change your own role'], 403);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->role = $request->role;
        $user->save();

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Get users for non-admin (regular members)
     */
    public function index()
    {
        $users = User::where('role', '!=', 'admin')->get();
        return response()->json($users);
    }
}

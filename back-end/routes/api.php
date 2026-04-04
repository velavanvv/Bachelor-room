<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

// Test public route
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working without CSRF!',
        'timestamp' => now(),
    ]);
});

// Public auth routes
Route::post('/login', [App\Http\Controllers\AuthController::class, 'login']);
Route::post('/forgot-password', [App\Http\Controllers\ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password', [App\Http\Controllers\ResetPasswordController::class, 'reset']);

// Protected routes - ONLY auth:sanctum middleware
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [App\Http\Controllers\AuthController::class, 'logout']);

    // Test authenticated route
    Route::get('/check-auth', function () {
        return response()->json([
            'authenticated' => true,
            'user' => auth()->user()->only(['id', 'name', 'email', 'role']),
        ]);
    });
  
    // User routes
    Route::get('/users', [App\Http\Controllers\Admin\UserController::class, 'index']);
    
    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/activities', [DashboardController::class, 'activities']);
    Route::post('/chatbot/message', [App\Http\Controllers\ChatbotController::class, 'message']);
    Route::get('/chat-room/messages', [App\Http\Controllers\ChatRoomController::class, 'index']);
    Route::post('/chat-room/messages', [App\Http\Controllers\ChatRoomController::class, 'store']);
    
    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/users', [App\Http\Controllers\Admin\UserController::class, 'getAllUsers']);
        Route::post('/create-member', [App\Http\Controllers\Admin\UserController::class, 'createMember']);
        Route::put('/users/{id}/role', [App\Http\Controllers\Admin\UserController::class, 'updateRole']);
        Route::delete('/users/{id}', [App\Http\Controllers\Admin\UserController::class, 'destroy']);
    });

    // Contributions
    Route::post('/contributions/pay', [App\Http\Controllers\ContributionController::class, 'pay']);
    Route::get('/contributions/month/{month}', [App\Http\Controllers\ContributionController::class, 'getByMonth']);
    
    // Expenses
    Route::get('/expenses', [App\Http\Controllers\ExpenseController::class, 'index']);
    Route::post('/expenses', [App\Http\Controllers\ExpenseController::class, 'store']);
    Route::get('/expenses/recent', [App\Http\Controllers\ExpenseController::class, 'recent']);
    Route::get('/expenses/month/{month}', [App\Http\Controllers\ExpenseController::class, 'byMonth']);
    Route::delete('/expenses/{id}', [App\Http\Controllers\ExpenseController::class, 'destroy']);
      Route::get('/wallet/current', [App\Http\Controllers\WalletController::class, 'currentMonth']);

    // Wallet
    Route::get('/wallet/{month}', [App\Http\Controllers\WalletController::class, 'show']);
  });

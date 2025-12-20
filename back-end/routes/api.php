<?php

use Illuminate\Support\Facades\Route;

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
    
    // Wallet
    Route::get('/wallet/{month}', [App\Http\Controllers\WalletController::class, 'show']);
    Route::get('/wallet/current', [App\Http\Controllers\WalletController::class, 'currentMonth']);
});
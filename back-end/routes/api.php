<?php

use App\Http\Controllers\ContributionController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // User routes (for all authenticated users)
    Route::get('/users', [UserController::class, 'index']);

    // Admin only routes
    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/users', [UserController::class, 'getAllUsers']);
        Route::post('/create-member', [UserController::class, 'createMember']);
        Route::put('/users/{id}/role', [UserController::class, 'updateRole']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // Contributions
    Route::post('/contributions/pay', [ContributionController::class, 'pay']);
    Route::get('/contributions/month/{month}', [ContributionController::class, 'getByMonth']);

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/recent', [ExpenseController::class, 'recent']);
    Route::get('/expenses/month/{month}', [ExpenseController::class, 'byMonth']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // Wallet
    Route::get('/wallet/{month}', [WalletController::class, 'show']);
    Route::get('/wallet/current', [WalletController::class, 'currentMonth']);
});

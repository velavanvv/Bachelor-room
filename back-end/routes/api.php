<?php

use App\Http\Controllers\ContributionController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\UserController as PublicUserController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Users
    Route::get('/users', [PublicUserController::class, 'index']);

    // Admin only
    Route::middleware('admin')->group(function () {
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/create-member', [UserController::class, 'createMember']);
    });

    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/expenses/recent', [ExpenseController::class, 'recent']);
    Route::get('/expenses/month/{month}', [ExpenseController::class, 'byMonth']);
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

    // Contributions
    Route::post('/contributions/pay', [ContributionController::class, 'pay']);
    Route::get('/contributions/month/{month}', [ContributionController::class, 'getByMonth']);

    // Wallet
    Route::get('/wallet/{month}', [WalletController::class, 'show']);
    Route::get('/wallet/current', [WalletController::class, 'currentMonth']);
});

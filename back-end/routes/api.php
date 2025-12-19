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

    // Admin only
    Route::post('/admin/create-member', [UserController::class, 'createMember']);

    // Expenses
    Route::post('/contributions/pay', [ContributionController::class, 'pay']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::get('/wallet/{month}', [WalletController::class, 'show']);
});



?>
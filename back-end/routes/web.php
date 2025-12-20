<?php

use Illuminate\Support\Facades\Route;

// Basic web route
Route::get('/', function () {
    return 'Bachelor Room Management System API';
});

// Login route for web (if needed)
Route::get('/login', function () {
    return response()->json([
        'message' => 'Please use the API: POST /api/login with email and password',
        'example' => [
            'email' => 'admin@example.com',
            'password' => 'password'
        ]
    ]);
})->name('login');
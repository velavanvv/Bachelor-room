<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
class AdminSeeder extends Seeder
{

public function run()
{
    User::create([
        'name' => 'Admin',
        'email' => 'admin@gmail.com',
        'phone' => '9999999999',
        'role' => 'admin',
        'password' => Hash::make('admin123'),
    ]);
}
}





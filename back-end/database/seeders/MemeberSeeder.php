<?php


namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MemeberSeeder extends Seeder{



public function run()
{
    User::create([
        'name' => 'vela',
        'email' => 'member@gmail.com',
        'phone' => '9999999999',
        'role' => 'member',
        'password' => Hash::make('member123'),
    ]);
}
}
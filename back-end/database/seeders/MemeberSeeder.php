<?php


namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class MemeberSeeder extends Seeder{



public function run()
{
    User::updateOrCreate(
        ['email' => 'member@gmail.com'],
        [
            'name' => 'vela',
            'phone' => '9999999999',
            'role' => 'member',
            'password' => Hash::make('member123'),
        ]
    );
}
}

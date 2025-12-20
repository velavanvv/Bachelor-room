<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use Carbon\Carbon;

class WalletController extends Controller
{
    public function show($month)
    {
        $wallet = Wallet::where('month', $month)->first();

        if (!$wallet) {
            return response()->json([
                'total_collected' => 0,
                'total_spent' => 0,
                'balance' => 0
            ]);
        }

        return response()->json($wallet);
    }

    public function currentMonth()
    {
        $month = Carbon::now()->format('Y-m');
        $wallet = Wallet::where('month', $month)->first();

        if (!$wallet) {
            return response()->json([
                'total_collected' => 0,
                'total_spent' => 0,
                'balance' => 0
            ]);
        }

        return response()->json($wallet);
    }
}

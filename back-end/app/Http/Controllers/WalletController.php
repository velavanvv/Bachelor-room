<?php

namespace App\Http\Controllers;

use App\Models\Wallet;

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
}

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
                'balance' => $this->getCarryForwardBalance($month)
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
                'balance' => $this->getCarryForwardBalance($month)
            ]);
        }

        return response()->json($wallet);
    }

    private function getCarryForwardBalance(string $month): int
    {
        return (int) (Wallet::where('month', '<', $month)
            ->orderBy('month', 'desc')
            ->value('balance') ?? 0);
    }
}

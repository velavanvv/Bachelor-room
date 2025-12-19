<?php

namespace App\Http\Controllers;

use App\Models\MonthlyContribution;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ContributionController extends Controller
{
    public function pay(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required',
            'amount' => 'required|integer|min:1'
        ]);

        $contribution = MonthlyContribution::updateOrCreate(
            [
                'user_id' => $request->user_id,
                'month' => $request->month,
            ],
            [
                'amount' => $request->amount,
                'status' => 'paid',
                'paid_date' => Carbon::now()
            ]
        );

        // Wallet update
        $wallet = Wallet::firstOrCreate(['month' => $request->month]);
        $wallet->total_collected += $request->amount;
        $wallet->balance += $request->amount;
        $wallet->save();

        return response()->json([
            'message' => 'Payment recorded successfully',
            'data' => $contribution
        ]);
    }

    public function getByMonth($month)
    {
        $data = MonthlyContribution::with('user')
            ->where('month', $month)
            ->get();

        return response()->json($data);
    }
}

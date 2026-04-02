<?php

namespace App\Http\Controllers;

use App\Models\MonthlyContribution;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ContributionController extends Controller
{
    public function pay(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required|date_format:Y-m',
            'amount' => 'required|integer|min:1'
        ]);

        $contribution = DB::transaction(function () use ($validated) {
            $existingContribution = MonthlyContribution::where('user_id', $validated['user_id'])
                ->where('month', $validated['month'])
                ->lockForUpdate()
                ->first();

            $previousAmount = $existingContribution?->amount ?? 0;

            $contribution = MonthlyContribution::updateOrCreate(
                [
                    'user_id' => $validated['user_id'],
                    'month' => $validated['month'],
                ],
                [
                    'amount' => $validated['amount'],
                    'status' => 'paid',
                    'paid_date' => Carbon::now(),
                ]
            );

            $wallet = Wallet::firstOrCreate(
                ['month' => $validated['month']],
                [
                    'total_collected' => 0,
                    'total_spent' => 0,
                    'balance' => $this->getCarryForwardBalance($validated['month']),
                ]
            );

            $amountDelta = $validated['amount'] - $previousAmount;
            $wallet->total_collected += $amountDelta;
            $wallet->balance += $amountDelta;
            $wallet->save();

            return $contribution;
        });

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

    private function getCarryForwardBalance(string $month): int
    {
        return (int) (Wallet::where('month', '<', $month)
            ->orderBy('month', 'desc')
            ->value('balance') ?? 0);
    }
}

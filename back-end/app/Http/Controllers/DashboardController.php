<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Expense;
use App\Models\Wallet;
use App\Models\MonthlyContribution;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        
        // Total members (for admin) or total users (for members)
        if ($user->role === 'admin') {
            $totalMembers = User::count();
        } else {
            $totalMembers = User::where('role', '!=', 'admin')->count();
        }

        // Current month wallet stats
        $currentMonth = Carbon::now()->format('Y-m');
        $wallet = Wallet::where('month', $currentMonth)->first();

        $totalContributions = $wallet ? $wallet->total_collected : 0;
        $totalExpenses = $wallet ? $wallet->total_spent : 0;
        $currentBalance = $wallet ? $wallet->balance : 0;

        return response()->json([
            'totalMembers' => $totalMembers,
            'totalContributions' => $totalContributions,
            'totalExpenses' => $totalExpenses,
            'currentBalance' => $currentBalance,
        ]);
    }

    public function activities(Request $request)
    {
        $user = $request->user();
        $activities = [];

        // Get recent contributions (last 7 days)
        $recentContributions = MonthlyContribution::with('user')
            ->where('paid_date', '>=', Carbon::now()->subDays(7))
            ->orderBy('paid_date', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentContributions as $contribution) {
            $activities[] = [
                'id' => 'c-' . $contribution->id,
                'type' => 'credit',
                'user' => $contribution->user->name ?? 'Unknown',
                'action' => 'Paid contribution',
                'amount' => $contribution->amount,
                'date' => $contribution->paid_date,
                'description' => 'Monthly contribution payment',
            ];
        }

        // Get recent expenses (last 7 days)
        $recentExpenses = Expense::with('user')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        foreach ($recentExpenses as $expense) {
            $activities[] = [
                'id' => 'e-' . $expense->id,
                'type' => 'debit',
                'user' => $expense->user->name ?? 'Unknown',
                'action' => $expense->description,
                'amount' => $expense->amount,
                'date' => $expense->expense_date,
                'description' => 'Expense added',
            ];
        }

        // If admin, show recent user additions
        if ($user->role === 'admin') {
            $recentUsers = User::where('created_at', '>=', Carbon::now()->subDays(7))
                ->orderBy('created_at', 'desc')
                ->limit(3)
                ->get();

            foreach ($recentUsers as $recentUser) {
                $activities[] = [
                    'id' => 'u-' . $recentUser->id,
                    'type' => 'info',
                    'user' => 'Admin',
                    'action' => 'Added new member: ' . $recentUser->name,
                    'amount' => null,
                    'date' => $recentUser->created_at,
                    'description' => 'New member registration',
                ];
            }
        }

        // Sort activities by date (newest first)
        usort($activities, function($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        // Return only top 10 activities
        return response()->json(array_slice($activities, 0, 10));
    }
}
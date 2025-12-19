<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Wallet;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'expense_date' => 'required|date',
            'description' => 'required|string',
            'amount' => 'required|integer|min:1',
            'created_by' => 'required|exists:users,id'
        ]);

        $expense = Expense::create($request->all());

        $month = date('Y-m', strtotime($request->expense_date));

        $wallet = Wallet::firstOrCreate(['month' => $month]);
        $wallet->total_spent += $request->amount;
        $wallet->balance -= $request->amount;
        $wallet->save();

        return response()->json([
            'message' => 'Expense added successfully',
            'data' => $expense
        ]);
    }

    public function getByDate($date)
    {
        $expenses = Expense::where('expense_date', $date)->get();
        return response()->json($expenses);
    }
}

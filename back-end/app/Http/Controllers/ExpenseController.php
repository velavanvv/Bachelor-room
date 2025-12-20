<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with('user')->orderBy('expense_date', 'desc')->get();
        return response()->json($expenses);
    }

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

    public function recent()
    {
        $expenses = Expense::with('user')
            ->orderBy('expense_date', 'desc')
            ->limit(10)
            ->get();
        return response()->json($expenses);
    }

    public function byMonth($month)
    {
        $expenses = Expense::with('user')
            ->where('expense_date', 'like', $month . '%')
            ->get();
        return response()->json($expenses);
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);

        // Refund wallet
        $month = date('Y-m', strtotime($expense->expense_date));
        $wallet = Wallet::where('month', $month)->first();
        if ($wallet) {
            $wallet->total_spent -= $expense->amount;
            $wallet->balance += $expense->amount;
            $wallet->save();
        }

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }

    public function getByDate($date)
    {
        $expenses = Expense::where('expense_date', $date)->get();
        return response()->json($expenses);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with('user')->orderBy('expense_date', 'desc')->get();
        return response()->json($expenses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_date' => 'required|date',
            'description' => 'required|string',
            'amount' => 'required|integer|min:1',
            'created_by' => 'required|exists:users,id'
        ]);

        $expense = DB::transaction(function () use ($validated) {
            $month = date('Y-m', strtotime($validated['expense_date']));

            $wallet = Wallet::firstOrCreate(
                ['month' => $month],
                [
                    'total_collected' => 0,
                    'total_spent' => 0,
                    'balance' => $this->getCarryForwardBalance($month),
                ]
            );

            if ($validated['amount'] > $wallet->balance) {
                throw ValidationException::withMessages([
                    'amount' => ['Expense amount cannot be greater than the current balance.'],
                ]);
            }

            $expense = Expense::create($validated);

            $wallet->total_spent += $validated['amount'];
            $wallet->balance -= $validated['amount'];
            $wallet->save();

            return $expense;
        });

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
        DB::transaction(function () use ($id) {
            $expense = Expense::findOrFail($id);

            $month = date('Y-m', strtotime($expense->expense_date));
            $wallet = Wallet::where('month', $month)->lockForUpdate()->first();

            if ($wallet) {
                $wallet->total_spent -= $expense->amount;
                $wallet->balance += $expense->amount;
                $wallet->save();
            }

            $expense->delete();
        });

        return response()->json(['message' => 'Expense deleted successfully']);
    }

    public function getByDate($date)
    {
        $expenses = Expense::where('expense_date', $date)->get();
        return response()->json($expenses);
    }

    private function getCarryForwardBalance(string $month): int
    {
        return (int) (Wallet::where('month', '<', $month)
            ->orderBy('month', 'desc')
            ->value('balance') ?? 0);
    }
}

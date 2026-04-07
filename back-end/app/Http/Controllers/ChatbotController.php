<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\MonthlyContribution;
use App\Models\User;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    private function sanitizeReply(string $reply): string
    {
        $cleaned = preg_replace('/<think>[\s\S]*?(<\/think>|$)/i', '', $reply) ?? $reply;
        $cleaned = preg_replace('/^\s*#+\s*/m', '', $cleaned) ?? $cleaned;

        $cleaned = trim($cleaned);

        return $cleaned !== '' ? $cleaned : 'I could not format that response cleanly. Please ask again.';
    }

    private function buildRoomContext(Request $request): string
    {
        $user = $request->user();
        $currentMonth = Carbon::now()->format('Y-m');
        $wallet = Wallet::where('month', $currentMonth)->first();
        $memberCount = User::where('role', '!=', 'admin')->count();
        $allUsersCount = User::count();
        $monthlyContributions = MonthlyContribution::with('user')
            ->where('month', $currentMonth)
            ->orderByDesc('paid_date')
            ->get();
        $recentExpenses = Expense::with('user')
            ->orderByDesc('expense_date')
            ->limit(5)
            ->get();

        $paidCount = $monthlyContributions->where('status', 'paid')->count();
        $pendingCount = max($memberCount - $paidCount, 0);

        $recentExpenseSummary = $recentExpenses->map(function ($expense) {
            return sprintf(
                '%s on %s by %s',
                $expense->description,
                (string) $expense->amount,
                $expense->user->name ?? 'Unknown'
            );
        })->implode('; ');

        $recentContributionSummary = $monthlyContributions->take(5)->map(function ($contribution) {
            return sprintf(
                '%s paid %s (%s)',
                $contribution->user->name ?? 'Unknown',
                (string) $contribution->amount,
                $contribution->status
            );
        })->implode('; ');

        $personalContribution = MonthlyContribution::where('user_id', $user->id)
            ->where('month', $currentMonth)
            ->first();

        $personalExpenseCount = Expense::where('created_by', $user->id)
            ->where('expense_date', 'like', $currentMonth . '%')
            ->count();

        return implode("\n", [
            'Live room data for grounding:',
            'Current month: ' . $currentMonth,
            'Current wallet total_collected: ' . ($wallet->total_collected ?? 0),
            'Current wallet total_spent: ' . ($wallet->total_spent ?? 0),
            'Current wallet balance: ' . ($wallet->balance ?? 0),
            'Total users including admin: ' . $allUsersCount,
            'Total non-admin members: ' . $memberCount,
            'Paid contributions this month: ' . $paidCount,
            'Pending contributions this month: ' . $pendingCount,
            'Recent expenses: ' . ($recentExpenseSummary ?: 'none'),
            'Recent contributions: ' . ($recentContributionSummary ?: 'none'),
            'Current user contribution this month: ' . ($personalContribution?->amount ?? 0),
            'Current user contribution status this month: ' . ($personalContribution?->status ?? 'unpaid'),
            'Current user expense count this month: ' . $personalExpenseCount,
            'Use this data when answering product and finance questions. If the user asks for data not present here, say it is not available instead of inventing it.',
        ]);
    }

    public function message(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:4000',
            'history' => 'nullable|array',
            'history.*.role' => 'required_with:history|in:user,assistant',
            'history.*.content' => 'required_with:history|string|max:4000',
        ]);

        $apiKey = env('SAMBANOVA_API_KEY');
        $model = env('SAMBANOVA_MODEL', 'DeepSeek-R1-0528');

        if (!$apiKey) {
            return response()->json([
                'message' => 'SambaNova API key is not configured on the server.',
            ], 500);
        }

        $history = collect($validated['history'] ?? [])
            ->filter(fn ($item) => !empty($item['role']) && !empty($item['content']))
            ->take(-8)
            ->map(function ($item) {
                return [
                    'role' => $item['role'] === 'assistant' ? 'assistant' : 'user',
                    'content' => $item['content'],
                ];
            })
            ->values()
            ->all();

        $systemPrompt = sprintf(
            'You are the Bachelor Room assistant. The current user is %s with role %s. Help with expenses, contributions, wallet usage, admin/member flows, and product guidance. Keep replies practical and concise. Never reveal chain-of-thought, hidden reasoning, or <think> blocks. Return only the final user-facing answer.',
            $request->user()->name ?? 'Unknown user',
            $request->user()->role ?? 'member'
        );
        $roomContext = $this->buildRoomContext($request);

        $response = Http::timeout(30)
            ->withToken($apiKey)
            ->post('https://api.sambanova.ai/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $systemPrompt . "\n\n" . $roomContext,
                    ],
                    ...$history,
                    [
                        'role' => 'user',
                        'content' => $validated['message'],
                    ],
                ],
                'temperature' => 0.7,
                'max_tokens' => 512,
            ]);

        if ($response->failed()) {
            return response()->json([
                'message' => data_get($response->json(), 'error.message', 'Failed to get chatbot response.'),
            ], $response->status() ?: 500);
        }

        $reply = $this->sanitizeReply(
            trim((string) data_get($response->json(), 'choices.0.message.content', ''))
        );

        return response()->json([
            'reply' => $reply ?: 'No response received from SambaNova.',
            'model' => $model,
        ]);
    }
}

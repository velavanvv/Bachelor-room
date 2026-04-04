<?php

namespace App\Http\Controllers;

use App\Models\ChatRoomMessage;
use Illuminate\Http\Request;

class ChatRoomController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'room' => 'nullable|string|max:100',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $room = $validated['room'] ?? 'main-room';
        $limit = $validated['limit'] ?? 50;

        $messages = ChatRoomMessage::with('user')
            ->where('room', $room)
            ->latest()
            ->limit($limit)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (ChatRoomMessage $message) => $this->transformMessage($message));

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'room' => 'nullable|string|max:100',
            'content' => 'required|string|max:2000',
        ]);

        $message = ChatRoomMessage::create([
            'room' => $validated['room'] ?? 'main-room',
            'content' => trim($validated['content']),
            'user_id' => $request->user()->id,
        ])->load('user');

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => $this->transformMessage($message),
        ], 201);
    }

    private function transformMessage(ChatRoomMessage $message): array
    {
        return [
            'id' => $message->id,
            'room' => $message->room,
            'content' => $message->content,
            'created_at' => optional($message->created_at)->toISOString(),
            'user' => [
                'id' => $message->user?->id,
                'name' => $message->user?->name ?? 'Unknown',
                'role' => $message->user?->role ?? 'member',
            ],
        ];
    }
}

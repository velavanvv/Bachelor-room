<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatRoomMessage extends Model
{
    protected $fillable = [
        'room',
        'content',
        'user_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

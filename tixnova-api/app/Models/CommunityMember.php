<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityMember extends Model
{
    protected $fillable = [
        'community_id', 'user_id', 'role', 'joined_at',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function community(): BelongsTo
    {
        return $this->belongsTo(Community::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isLeader(): bool
    {
        return $this->role === 'leader';
    }
}

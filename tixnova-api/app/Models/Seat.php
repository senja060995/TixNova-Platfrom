<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Seat extends Model
{
    protected $fillable = [
        'seat_map_id', 'ticket_id', 'section', 'row_label', 'number', 'label', 'status', 'hold_order_id', 'held_at', 'sold_at',
    ];

    protected $casts = [
        'held_at' => 'datetime',
        'sold_at' => 'datetime',
    ];

    public function seatMap(): BelongsTo
    {
        return $this->belongsTo(SeatMap::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function holdOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'hold_order_id');
    }
}

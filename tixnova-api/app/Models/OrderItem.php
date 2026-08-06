<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'ticket_id', 'seat_id', 'quantity', 'price',
        'seat_number', 'attendee_name', 'attendee_email', 'attendee_phone',
        'qr_code', 'qr_used', 'qr_used_at',
        'eticket_sent', 'eticket_sent_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'qr_used' => 'boolean',
        'qr_used_at' => 'datetime',
        'eticket_sent' => 'boolean',
        'eticket_sent_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function seat(): BelongsTo
    {
        return $this->belongsTo(Seat::class);
    }

    public function scanLogs(): HasMany
    {
        return $this->hasMany(ScanLog::class);
    }
}

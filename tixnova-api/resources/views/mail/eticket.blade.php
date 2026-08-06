<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 14px; line-height: 1.5; }
        .card { max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .code { padding: 12px; background: #f3f4f6; border-radius: 8px; font-weight: bold; }
        .ticket { margin-top: 16px; padding: 16px; border: 1px solid #d1d5db; border-radius: 8px; }
        .qr { font-family: monospace; word-break: break-all; color: #2563eb; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Pembayaran Berhasil</h1>
        <p>Halo {{ $order->buyer_name }}, pembayaran Anda untuk <strong>{{ $order->event->title }}</strong> telah berhasil diverifikasi.</p>
        <p class="code">Kode Order: {{ $order->order_code }}</p>
        <p>Total pembayaran: <strong>Rp {{ number_format($order->total, 0, ',', '.') }}</strong></p>

        <h2>E-Tiket</h2>
        @foreach ($order->items as $index => $item)
            <div class="ticket">
                <strong>Tiket {{ $index + 1 }}: {{ $item->ticket->name }}</strong><br>
                Pemegang tiket: {{ $item->attendee_name }}<br>
                @if ($item->seat?->label ?? $item->seat_number)
                    Kursi: {{ $item->seat?->label ?? $item->seat_number }}<br>
                @endif
                Event: {{ $order->event->title }}<br>
                Lokasi: {{ $order->event->venue }}, {{ $order->event->city }}<br>
                <span class="qr">Kode QR: {{ $item->qr_code }}</span>
            </div>
        @endforeach

        <p>Tunjukkan QR tiket saat check-in di venue. Jangan bagikan kode QR kepada pihak lain.</p>
    </div>
</body>
</html>

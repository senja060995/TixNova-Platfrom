<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Tiket TixNova</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#1f2937; font-size:14px; line-height:1.5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:24px;">
                    <tr>
                        <td style="padding-bottom:20px; border-bottom:1px solid #e5e7eb;">
                            <img src="{{ asset('TN.png') }}" alt="TixNova" width="140" height="auto" style="display:block; width:140px; height:auto; border:0; outline:none; text-decoration:none;" />
                        </td>
                    </tr>
                    @php $event = $order->event; @endphp
                    <tr>
                        <td style="padding:20px 0;">
                            <img src="{{ $event->cover_url }}" alt="{{ $event->title }}" width="640" height="auto" style="display:block; width:100%; height:auto; border-radius:10px; border:0; outline:none;" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h1 style="margin:0 0 12px; font-size:24px; color:#1f2937;">Pembayaran Berhasil</h1>
                            <p style="margin:0 0 12px;">Halo <strong>{{ $order->buyer_name }}</strong>, pembayaran Anda untuk <strong>{{ $event->title }}</strong> telah berhasil diverifikasi.</p>
                            <p style="margin:0 0 12px; padding:12px; background:#f3f4f6; border-radius:8px; font-weight:bold;">Kode Order: {{ $order->order_code }}</p>
                            <p style="margin:0 0 16px;">Total pembayaran: <strong>Rp {{ number_format($order->total, 0, ',', '.') }}</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h2 style="margin:0 0 12px; font-size:18px; color:#1f2937;">E-Tiket</h2>
                            @foreach ($order->items as $index => $item)
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px; padding:16px; border:1px solid #d1d5db; border-radius:8px;">
                                    <tr>
                                        <td style="font-size:14px;">
                                            <strong>Tiket {{ $index + 1 }}: {{ $item->ticket->name }}</strong><br>
                                            Pemegang tiket: {{ $item->attendee_name }}<br>
                                            @if ($item->seat?->label ?? $item->seat_number)
                                                Kursi: {{ $item->seat?->label ?? $item->seat_number }}<br>
                                            @endif
                                            Event: {{ $event->title }}<br>
                                            Lokasi: {{ $event->venue }}, {{ $event->city }}<br>
                                            <span style="font-family:monospace; word-break:break-all; color:#2563eb;">Kode QR: {{ $item->qr_code }}</span>
                                        </td>
                                    </tr>
                                </table>
                            @endforeach
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:8px; border-top:1px solid #e5e7eb;">
                            <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">Tunjukkan QR tiket saat check-in di venue. Jangan bagikan kode QR kepada pihak lain.</p>
                            <p style="margin:8px 0 0; font-size:12px; color:#6b7280;">TixNova - Platform Ticketing Konser Modern Indonesia</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

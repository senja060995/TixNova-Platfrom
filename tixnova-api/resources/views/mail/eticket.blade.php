<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>E-Tiket TixNova</title>
</head>
<body style="margin:0;padding:0;background-color:#0F0F17;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0F0F17;padding:32px 16px;">
        <tr>
            <td align="center">

                <!-- Container -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#0F0F17;border:1px solid #2D2D4E;border-radius:20px;overflow:hidden;">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#1A1A2E;padding:36px 32px 28px;">
                            <img src="{{ $logo }}" alt="TixNova" width="88" height="88" style="display:inline-block;width:88px;height:88px;border:0;border-radius:20px;box-shadow:0 8px 24px rgba(124,58,237,0.35);">
                            <div style="margin-top:16px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:22px;font-weight:900;color:#F8FAFC;letter-spacing:0.5px;">TixNova</div>
                            <div style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:11px;color:#94A3B8;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Tiketing Konser &amp; Event</div>
                        </td>
                    </tr>

                    <!-- Hero / Status -->
                    <tr>
                        <td style="background-image:linear-gradient(135deg,#7C3AED 0%,#5B21B6 100%);padding:40px 32px;text-align:center;">
                            <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="width:56px;height:56px;background-color:rgba(255,255,255,0.18);border-radius:50%;">
                                <tr><td align="center" valign="middle" style="font-family:Inter,Arial,sans-serif;font-size:28px;font-weight:900;color:#FFFFFF;">&#10003;</td></tr>
                            </table>
                            <div style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:26px;font-weight:900;color:#FFFFFF;margin-top:18px;">Pembayaran Berhasil</div>
                            <div style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:14px;color:rgba(255,255,255,0.85);margin-top:8px;line-height:1.6;">
                                Halo <strong style="color:#FFFFFF;">{{ $order->buyer_name }}</strong>, pembayaran Anda untuk event di bawah telah terverifikasi.
                            </div>
                        </td>
                    </tr>

                    <!-- Order Summary -->
                    <tr>
                        <td style="padding:28px 32px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1A1A2E;border:1px solid #2D2D4E;border-radius:16px;overflow:hidden;">
                                <tr>
                                    <td style="padding:20px 24px;border-bottom:1px solid #2D2D4E;">
                                        <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A78BFA;margin-bottom:6px;">Ringkasan Pesanan</div>
                                        <div style="font-family:Inter,Arial,sans-serif;font-size:19px;font-weight:800;color:#F8FAFC;">{{ $order->event->title }}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:16px 24px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#94A3B8;padding:6px 0;">Kode Order</td>
                                                <td align="right" style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:#F8FAFC;padding:6px 0;letter-spacing:1px;">{{ $order->order_code }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#94A3B8;padding:6px 0;">Nama Pemesan</td>
                                                <td align="right" style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#F8FAFC;padding:6px 0;">{{ $order->buyer_name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#94A3B8;padding:6px 0;">Jumlah Tiket</td>
                                                <td align="right" style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#F8FAFC;padding:6px 0;">{{ $order->items->sum('quantity') }} tiket</td>
                                            </tr>
                                            <tr>
                                                <td style="font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:700;color:#F8FAFC;padding:10px 0 4px;border-top:1px dashed #2D2D4E;">Total Pembayaran</td>
                                                <td align="right" style="font-family:Inter,Arial,sans-serif;font-size:18px;font-weight:900;color:#10B981;padding:10px 0 4px;border-top:1px dashed #2D2D4E;">Rp {{ number_format($order->total, 0, ',', '.') }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- E-Tickets -->
                    <tr>
                        <td style="padding:28px 32px 0;">
                            <div style="font-family:Inter,Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A78BFA;margin-bottom:14px;">E-Tiket Anda</div>

                            @foreach ($tickets as $index => $ticket)
                                @php $item = $ticket['item']; @endphp
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1A1A2E;border:1px solid #2D2D4E;border-radius:16px;overflow:hidden;margin-bottom:16px;">
                                    <tr>
                                        <td style="width:40px;background-color:#252540;border-right:2px dashed #2D2D4E;"></td>
                                        <td style="width:150px;padding:16px;text-align:center;background-color:#0F0F17;">
                                            <img src="{{ $ticket['qr'] }}" alt="QR {{ $item->qr_code }}" width="150" height="150" style="width:150px;height:150px;border-radius:12px;border:0;">
                                            <div style="font-family:'Courier New',monospace;font-size:9px;color:#94A3B8;word-break:break-all;margin-top:8px;letter-spacing:0.5px;">{{ $item->qr_code }}</div>
                                        </td>
                                        <td style="padding:16px 18px;">
                                            <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#A78BFA;">Tiket {{ $index + 1 }} &middot; {{ $item->ticket->name }}</div>
                                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
                                                <tr>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#94A3B8;padding:3px 0;width:110px;">Pemegang tiket</td>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#F8FAFC;font-weight:700;padding:3px 0;">{{ $item->attendee_name }}</td>
                                                </tr>
                                                @if ($item->seat?->label ?? $item->seat_number)
                                                <tr>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#94A3B8;padding:3px 0;">Kursi</td>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#F8FAFC;font-weight:700;padding:3px 0;">{{ $item->seat?->label ?? $item->seat_number }}</td>
                                                </tr>
                                                @endif
                                                <tr>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#94A3B8;padding:3px 0;">Event</td>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#F8FAFC;font-weight:700;padding:3px 0;">{{ $order->event->title }}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#94A3B8;padding:3px 0;">Lokasi</td>
                                                    <td style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#F8FAFC;font-weight:700;padding:3px 0;">{{ $order->event->venue }}, {{ $order->event->city }}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            @endforeach
                        </td>
                    </tr>

                    <!-- Note -->
                    <tr>
                        <td style="padding:8px 32px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.35);border-radius:12px;">
                                <tr>
                                    <td style="padding:14px 18px;font-family:Inter,Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#FBBF24;">
                                        <strong>Penting:</strong> Tunjukkan QR tiket saat check-in di venue. Jangan bagikan kode QR kepada pihak lain demi keamanan tiket Anda.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td align="center" style="padding:24px 32px 8px;">
                            <a href="{{ config('services.frontend_url', 'https://tiketingkonser.cloud') }}/dashboard/my-tickets"
                               style="display:inline-block;background-color:#7C3AED;color:#FFFFFF;text-decoration:none;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:800;padding:14px 28px;border-radius:12px;">
                                Lihat Tiket di Dashboard
                            </a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding:28px 32px 32px;">
                            <div style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#475569;line-height:1.8;">
                                &copy; {{ date('Y') }} TixNova &mdash; Tiketing Konser &amp; Event<br>
                                Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.
                            </div>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>

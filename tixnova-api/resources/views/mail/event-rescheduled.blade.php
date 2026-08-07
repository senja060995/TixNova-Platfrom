<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jadwal Event Diubah</title>
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
                    @php $event = $reschedule->event; @endphp
                    <tr>
                        <td style="padding:20px 0;">
                            <img src="{{ $event->cover_url }}" alt="{{ $event->title }}" width="640" height="auto" style="display:block; width:100%; height:auto; border-radius:10px; border:0; outline:none;" />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <h1 style="margin:0 0 12px; font-size:24px; color:#1f2937;">Jadwal Event Diubah</h1>
                            <p style="margin:0 0 12px;">Halo, jadwal <strong>{{ $event->title }}</strong> telah diperbarui oleh penyelenggara.</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px; padding:16px; background:#eff6ff; border-radius:8px;">
                                <tr>
                                    <td style="font-size:14px;">
                                        <p style="margin:0 0 8px;"><strong>Jadwal lama:</strong> {{ $reschedule->previous_start_date->translatedFormat('l, d F Y H:i') }} WIB</p>
                                        <p style="margin:0 0 8px;"><strong>Jadwal baru:</strong> {{ $reschedule->new_start_date->translatedFormat('l, d F Y H:i') }} WIB</p>
                                        <p style="margin:0;"><strong>Lokasi:</strong> {{ $event->venue }}, {{ $event->city }}</p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:0 0 12px;"><strong>Alasan perubahan:</strong> {{ $reschedule->reason }}</p>
                            <p style="margin:0;">Tiket Anda tetap berlaku untuk jadwal baru. Jika tidak dapat hadir, ajukan refund melalui dashboard TixNova sesuai kebijakan yang berlaku.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:16px; border-top:1px solid #e5e7eb;">
                            <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">TixNova - Platform Ticketing Konser Modern Indonesia</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

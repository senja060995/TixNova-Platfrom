<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password TixNova</title>
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
                    <tr>
                        <td>
                            <h1 style="margin:0 0 12px; font-size:24px; color:#1f2937;">Reset Password</h1>
                            <p style="margin:0 0 12px;">Halo {{ $name }},</p>
                            <p style="margin:0 0 12px;">Kami menerima permintaan untuk mereset password akun TixNova Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
                            <p style="text-align:center; margin:24px 0;">
                                <a href="{{ $resetUrl }}" style="display:inline-block; padding:12px 24px; background:#2563eb; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold;">Reset Password</a>
                            </p>
                            <p style="margin:0 0 12px;">Atau salin tautan berikut ke browser Anda:</p>
                            <p style="margin:0 0 12px; word-break:break-all; color:#2563eb;">{{ $resetUrl }}</p>
                            <p style="margin:0;">Tautan ini akan kadaluarsa dalam 60 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
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

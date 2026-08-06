<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 14px; line-height: 1.5; }
        .card { max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Reset Password</h1>
        <p>Halo {{ $name }},</p>
        <p>Kami menerima permintaan untuk mereset password akun TixNova Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
        <p style="text-align: center; margin: 24px 0;">
            <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
        </p>
        <p>Atau salin tautan berikut ke browser Anda:</p>
        <p style="word-break: break-all; color: #2563eb;">{{ $resetUrl }}</p>
        <p>Tautan ini akan kadaluarsa dalam 60 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr style="margin: 16px 0; border-color: #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">TixNova - Platform Ticketing Konser Modern Indonesia</p>
    </div>
</body>
</html>
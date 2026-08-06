<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 14px; line-height: 1.5; }
        .card { max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .notice { padding: 16px; background: #eff6ff; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Jadwal Event Diubah</h1>
        <p>Halo, jadwal <strong>{{ $reschedule->event->title }}</strong> telah diperbarui oleh penyelenggara.</p>
        <div class="notice">
            <p><strong>Jadwal lama:</strong> {{ $reschedule->previous_start_date->translatedFormat('l, d F Y H:i') }} WIB</p>
            <p><strong>Jadwal baru:</strong> {{ $reschedule->new_start_date->translatedFormat('l, d F Y H:i') }} WIB</p>
            <p><strong>Lokasi:</strong> {{ $reschedule->event->venue }}, {{ $reschedule->event->city }}</p>
        </div>
        <p><strong>Alasan perubahan:</strong> {{ $reschedule->reason }}</p>
        <p>Tiket Anda tetap berlaku untuk jadwal baru. Jika tidak dapat hadir, ajukan refund melalui dashboard TixNova sesuai kebijakan yang berlaku.</p>
    </div>
</body>
</html>

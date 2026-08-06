<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #111827; font-size: 11px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; margin-top: 24px; }
        .muted { color: #6b7280; }
        .grid { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .grid td, .grid th { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        .grid th { background: #f3f4f6; }
        .number { text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Promotor</h1>
    <p class="muted">Periode {{ $filters['start_date'] }} sampai {{ $filters['end_date'] }} (UTC)</p>

    <h2>Ringkasan Keuangan</h2>
    <table class="grid">
        <tr><th>GMV</th><td class="number">Rp {{ number_format($summary['gmv'], 0, ',', '.') }}</td></tr>
        <tr><th>Revenue Tiket</th><td class="number">Rp {{ number_format($summary['ticket_revenue'], 0, ',', '.') }}</td></tr>
        <tr><th>Komisi Platform</th><td class="number">Rp {{ number_format($summary['platform_commission'], 0, ',', '.') }}</td></tr>
        <tr><th>Payout Promotor</th><td class="number">Rp {{ number_format($summary['promotor_payout'], 0, ',', '.') }}</td></tr>
        <tr><th>Order Lunas</th><td class="number">{{ $summary['paid_orders'] }}</td></tr>
    </table>

    <h2>Kehadiran</h2>
    <table class="grid">
        <tr><th>Tiket Terjual</th><td class="number">{{ $attendance['tickets_sold'] }}</td></tr>
        <tr><th>Check-in</th><td class="number">{{ $attendance['checked_in'] }}</td></tr>
        <tr><th>Rasio Check-in</th><td class="number">{{ number_format($attendance['check_in_rate'], 2) }}%</td></tr>
    </table>

    <h2>Penjualan per Tiket</h2>
    <table class="grid">
        <thead><tr><th>Tiket</th><th class="number">Terjual</th><th class="number">Revenue Tiket</th></tr></thead>
        <tbody>
            @forelse ($tickets as $ticket)
                <tr><td>{{ $ticket['name'] }}</td><td class="number">{{ $ticket['sold'] }}</td><td class="number">Rp {{ number_format($ticket['ticket_revenue'], 0, ',', '.') }}</td></tr>
            @empty
                <tr><td colspan="3">Belum ada transaksi lunas pada periode ini.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>

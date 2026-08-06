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
    <h1>Laporan Platform TixNova</h1>
    <p class="muted">Periode {{ $filters['start_date'] }} sampai {{ $filters['end_date'] }} (UTC)</p>

    <h2>Ringkasan Keuangan</h2>
    <table class="grid">
        <tr><th>GMV</th><td class="number">Rp {{ number_format($summary['gmv'], 0, ',', '.') }}</td></tr>
        <tr><th>Revenue Tiket</th><td class="number">Rp {{ number_format($summary['ticket_revenue'], 0, ',', '.') }}</td></tr>
        <tr><th>Komisi Platform</th><td class="number">Rp {{ number_format($summary['platform_commission'], 0, ',', '.') }}</td></tr>
        <tr><th>Total Payout Promotor</th><td class="number">Rp {{ number_format($summary['promotor_payout'], 0, ',', '.') }}</td></tr>
        <tr><th>Order Lunas</th><td class="number">{{ $summary['paid_orders'] }}</td></tr>
        <tr><th>Tenant Aktif</th><td class="number">{{ $summary['total_tenants'] }}</td></tr>
    </table>

    <h2>Top Promotor</h2>
    <table class="grid">
        <thead><tr><th>Promotor</th><th class="number">Order Lunas</th><th class="number">GMV</th><th class="number">Payout</th></tr></thead>
        <tbody>
            @forelse ($top_tenants as $tenant)
                <tr><td>{{ $tenant['name'] }}</td><td class="number">{{ $tenant['paid_orders'] }}</td><td class="number">Rp {{ number_format($tenant['gmv'], 0, ',', '.') }}</td><td class="number">Rp {{ number_format($tenant['promotor_payout'], 0, ',', '.') }}</td></tr>
            @empty
                <tr><td colspan="4">Belum ada transaksi lunas pada periode ini.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>

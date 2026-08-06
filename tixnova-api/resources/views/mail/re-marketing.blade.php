<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #1f2937; font-size: 14px; line-height: 1.5; }
        .card { max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
        .cta { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #6d28d9; color: #fff; border-radius: 10px; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h1>{{ $campaign->event ? $campaign->event->title : 'Event pilihan kami' }}</h1>
        <p>{{ $campaign->message }}</p>

        @if ($campaign->event)
            <div style="margin-top: 16px; padding: 16px; background: #f5f3ff; border-radius: 10px;">
                <p><strong>{{ $campaign->event->title }}</strong></p>
                <p>{{ $campaign->event->start_date->translatedFormat('l, d F Y H:i') }} WIB</p>
                <p>{{ $campaign->event->venue }}, {{ $campaign->event->city }}</p>
                @php
                    $minPrice = $campaign->event->tickets->filter(fn ($t) => $t->is_active)
                        ->min('price');
                @endphp
                @if ($minPrice !== null)
                    <p>Mulai dari Rp {{ number_format((float) $minPrice, 0, ',', '.') }}</p>
                @endif
                <a class="cta" href="{{ url('/events/' . $campaign->event->slug) }}">Lihat Event</a>
            </div>
        @endif

        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">Anda menerima email ini karena pernah membeli tiket di TixNova.</p>
    </div>
</body>
</html>

<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $campaign->subject }}</title>
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
                    @if ($campaign->event)
                        <tr>
                            <td style="padding:20px 0;">
                                <img src="{{ $campaign->event->cover_url }}" alt="{{ $campaign->event->title }}" width="640" height="auto" style="display:block; width:100%; height:auto; border-radius:10px; border:0; outline:none;" />
                            </td>
                        </tr>
                    @endif
                    <tr>
                        <td>
                            <h1 style="margin:0 0 12px; font-size:24px; color:#1f2937;">{{ $campaign->event ? $campaign->event->title : 'Event pilihan kami' }}</h1>
                            <p style="margin:0 0 12px;">{{ $campaign->message }}</p>
                        </td>
                    </tr>
                    @if ($campaign->event)
                        @php
                            $minPrice = $campaign->event->tickets->filter(fn ($t) => $t->is_active)->min('price');
                        @endphp
                        <tr>
                            <td>
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px; padding:16px; background:#f5f3ff; border-radius:10px;">
                                    <tr>
                                        <td style="font-size:14px;">
                                            <p style="margin:0 0 8px;"><strong>{{ $campaign->event->title }}</strong></p>
                                            <p style="margin:0 0 8px;">{{ $campaign->event->start_date->translatedFormat('l, d F Y H:i') }} WIB</p>
                                            <p style="margin:0 0 8px;">{{ $campaign->event->venue }}, {{ $campaign->event->city }}</p>
                                            @if ($minPrice !== null)
                                                <p style="margin:0 0 8px;">Mulai dari Rp {{ number_format((float) $minPrice, 0, ',', '.') }}</p>
                                            @endif
                                            <p style="margin:0;">
                                                <a href="{{ url('/events/'.$campaign->event->slug) }}" style="display:inline-block; padding:12px 24px; background:#6d28d9; color:#ffffff; border-radius:10px; text-decoration:none; font-weight:bold;">Lihat Event</a>
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    @endif
                    <tr>
                        <td style="padding-top:16px; border-top:1px solid #e5e7eb;">
                            <p style="margin:16px 0 0; font-size:12px; color:#6b7280;">Anda menerima email ini karena pernah membeli tiket di TixNova.</p>
                            <p style="margin:8px 0 0; font-size:12px; color:#6b7280;">TixNova - Platform Ticketing Konser Modern Indonesia</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

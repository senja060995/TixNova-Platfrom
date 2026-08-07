<?php

namespace App\Mail;

use App\Models\Order;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EticketMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "E-Tiket TixNova: {$this->order->event->title}",
        );
    }

    public function content(): Content
    {
        $tickets = $this->order->items->map(function ($item) {
            return [
                'item' => $item,
                'qr' => $this->qrDataUri($item->qr_code),
            ];
        });

        return new Content(
            view: 'mail.eticket',
            with: [
                'tickets' => $tickets,
                'logo' => $this->logoDataUri(),
            ],
        );
    }

    private function logoDataUri(): string
    {
        $path = public_path('email-logo.png');

        if (! file_exists($path)) {
            return '';
        }

        return 'data:image/png;base64,'.base64_encode((string) file_get_contents($path));
    }

    private function qrDataUri(string $content, int $scale = 6): string
    {
        $qr = Encoder::encode($content, ErrorCorrectionLevel::M(), 'UTF-8');
        $matrix = $qr->getMatrix();
        $cells = $matrix->getWidth();
        $pad = 4;
        $size = ($cells + ($pad * 2)) * $scale;

        $image = imagecreatetruecolor($size, $size);
        $white = imagecolorallocate($image, 255, 255, 255);
        $dark = imagecolorallocate($image, 31, 25, 61);

        imagefill($image, 0, 0, $white);

        for ($y = 0; $y < $cells; $y++) {
            for ($x = 0; $x < $cells; $x++) {
                if ($matrix->get($x, $y)) {
                    imagefilledrectangle(
                        $image,
                        ($x + $pad) * $scale,
                        ($y + $pad) * $scale,
                        (($x + $pad) * $scale) + $scale - 1,
                        (($y + $pad) * $scale) + $scale - 1,
                        $dark
                    );
                }
            }
        }

        ob_start();
        imagepng($image);
        $png = ob_get_clean();
        imagedestroy($image);

        return 'data:image/png;base64,'.base64_encode($png);
    }
}

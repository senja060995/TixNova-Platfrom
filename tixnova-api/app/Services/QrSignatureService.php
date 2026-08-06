<?php

namespace App\Services;

class QrSignatureService
{
    /**
     * Generate an HMAC signed payload for a QR code.
     */
    public function sign(string $qrCode, ?int $ticketId = null): string
    {
        $secret = config('app.key');
        $data = $ticketId ? "{$qrCode}:{$ticketId}" : $qrCode;
        $signature = substr(hash_hmac('sha256', $data, $secret), 0, 16);

        return "{$qrCode}.{$signature}";
    }

    /**
     * Verify an incoming QR code payload (supports both signed and legacy plain codes).
     */
    public function verify(string $payload, ?int $ticketId = null): array
    {
        $payload = trim($payload);
        $parts = explode('.', $payload);

        if (count($parts) === 2) {
            [$qrCode, $providedSig] = $parts;
            $secret = config('app.key');
            $data = $ticketId ? "{$qrCode}:{$ticketId}" : $qrCode;
            $expectedSig = substr(hash_hmac('sha256', $data, $secret), 0, 16);

            // Also check signature without ticketId fallback
            $fallbackSig = substr(hash_hmac('sha256', $qrCode, $secret), 0, 16);

            $isValid = hash_equals($expectedSig, $providedSig) || hash_equals($fallbackSig, $providedSig);

            return [
                'valid' => $isValid,
                'qr_code' => $qrCode,
                'signed' => true,
            ];
        }

        // Legacy / plain QR code without signature dot
        return [
            'valid' => true,
            'qr_code' => $payload,
            'signed' => false,
        ];
    }
}

<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $resetUrl,
        public string $name,
    ) {}

    public function build()
    {
        return $this->subject('Reset Password TixNova')
            ->view('mail.password-reset', [
                'name' => $this->name,
                'resetUrl' => $this->resetUrl,
            ]);
    }
}

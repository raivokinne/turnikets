<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Attachment;

class QrCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    private string $name;
    private string $email;
    private string $attachmentUrl;

    public function __construct(string $name, string $email, string $attachmentUrl)
    {
        $this->name = $name;
        $this->email = $email;
        $this->attachmentUrl = $attachmentUrl;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address('itadministrator@vtdt.edu.lv', 'IT Administrators'),
            subject: 'Tavs QR kods lietošanai dienesta viesnīcā!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.qrcode',
            with: [
                'name' => $this->name,
                'qrUrl' => $this->attachmentUrl,
            ]
        );
    }
    /**
     * @return array<int,Attachment>
     */
    public function attachments(): array
    {
        $fileContents = Http::get($this->attachmentUrl)->body();

        return [
            Attachment::fromData(fn () => $fileContents, 'qrcode.png')
                ->withMime('image/png'),
        ];
    }
}


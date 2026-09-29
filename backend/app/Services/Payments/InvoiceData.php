<?php

namespace App\Services\Payments;

final readonly class InvoiceData
{
    /**
     * @param  list<array{name: string, description: string|null, logo: string|null, link: string}>  $deeplinks  Bank app links
     * @param  array<string, mixed>  $raw  Provider response, stored on the payment
     */
    public function __construct(
        public string $invoiceId,
        public string $qrText,
        public ?string $qrImage,
        public ?string $shortUrl,
        public array $deeplinks,
        public array $raw,
    ) {}

    /** The subset the frontend needs to display the invoice. */
    public function toDisplayArray(): array
    {
        return [
            'qr_text' => $this->qrText,
            'qr_image' => $this->qrImage,
            'short_url' => $this->shortUrl,
            'deeplinks' => $this->deeplinks,
        ];
    }
}

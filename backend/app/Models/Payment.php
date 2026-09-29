<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $assessment_id
 * @property string $provider
 * @property string $reference
 * @property string|null $provider_invoice_id
 * @property int $amount
 * @property string $currency
 * @property PaymentStatus $status
 * @property Carbon|null $paid_at
 * @property array<string, mixed>|null $provider_response_json
 */
class Payment extends Model
{
    protected $fillable = [
        'assessment_id',
        'provider',
        'reference',
        'provider_invoice_id',
        'amount',
        'currency',
        'status',
        'paid_at',
        'provider_response_json',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => PaymentStatus::class,
            'paid_at' => 'datetime',
            'provider_response_json' => 'array',
        ];
    }

    public static function generateReference(): string
    {
        return 'SC'.strtoupper(bin2hex(random_bytes(12)));
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $assessment_id
 * @property array<string, mixed> $report_json
 * @property string $model
 */
class Report extends Model
{
    protected $fillable = ['assessment_id', 'report_json', 'model'];

    protected function casts(): array
    {
        return [
            'report_json' => 'encrypted:array',
        ];
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }
}

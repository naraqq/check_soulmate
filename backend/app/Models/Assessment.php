<?php

namespace App\Models;

use App\Enums\AssessmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $public_token
 * @property string $questionnaire_version
 * @property array<string, string|null> $answers_json
 * @property array<string, mixed>|null $teaser_json
 * @property AssessmentStatus $status
 * @property Carbon|null $paid_at
 * @property Carbon|null $generation_started_at
 * @property int $generation_attempts
 * @property string|null $failure_reason
 */
class Assessment extends Model
{
    use Prunable;

    public const TOKEN_PATTERN = '[a-f0-9]{48}';

    protected $fillable = [
        'previous_assessment_id',
        'public_token',
        'questionnaire_version',
        'answers_json',
        'teaser_json',
        'status',
        'failure_reason',
        'analytics_json',
    ];

    protected $hidden = ['id', 'answers_json', 'previous_assessment_id', 'feedback_json', 'analytics_json'];

    protected function casts(): array
    {
        return [
            'answers_json' => 'encrypted:array',
            'feedback_json' => 'encrypted:array',
            'feedback_submitted_at' => 'datetime',
            'analytics_json' => 'array',
            'teaser_json' => 'array',
            'status' => AssessmentStatus::class,
            'paid_at' => 'datetime',
            'generation_started_at' => 'datetime',
        ];
    }

    /** 24 random bytes from a CSPRNG, hex encoded. */
    public static function generateToken(): string
    {
        return bin2hex(random_bytes(24));
    }

    public function getRouteKeyName(): string
    {
        return 'public_token';
    }

    public function previousAssessment(): BelongsTo
    {
        return $this->belongsTo(self::class, 'previous_assessment_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function report(): HasOne
    {
        return $this->hasOne(Report::class);
    }

    /** Abandoned, never-paid assessments are removed by `php artisan model:prune`. */
    public function prunable(): Builder
    {
        return static::query()
            ->whereIn('status', [AssessmentStatus::Created, AssessmentStatus::PaymentPending])
            ->where('created_at', '<', now()->subDays(config('soulmate.unpaid_retention_days')));
    }
}

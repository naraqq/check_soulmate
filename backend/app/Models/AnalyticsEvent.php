<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

/**
 * One anonymous analytics event. See App\Services\Analytics.
 *
 * @property string $name
 * @property string|null $visitor_id
 * @property string $day
 */
class AnalyticsEvent extends Model
{
    use Prunable;

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    /** Keep a little over a year, enough for year-on-year comparisons of campaigns. */
    public function prunable(): Builder
    {
        return static::where('created_at', '<', now()->subDays((int) config('soulmate.analytics_retention_days', 400)));
    }
}

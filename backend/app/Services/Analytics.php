<?php

namespace App\Services;

use App\Enums\AssessmentStatus;
use App\Models\Assessment;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * First-party, anonymous product analytics for the marketing dashboard.
 *
 * Events hold a random browser id, first-touch attribution (UTM / referrer),
 * device, and — for server-side events only — a coarse segment (stage,
 * gender, age range). Never answers, tokens, IPs, free text or report content.
 *
 * Client events come from the browser; checkout_started and payment_confirmed
 * are recorded by the server, so revenue always matches verified payments.
 */
class Analytics
{
    /** Events the browser may send. Everything else is recorded server-side. */
    public const CLIENT_EVENTS = [
        'landing_viewed',
        'check_started',
        'question_answered',
        'check_completed',
        'paywall_viewed',
        'payment_started',
        'report_viewed',
        'assessment_deleted',
        'share_opened',
        'share_completed',
        'guess_opened',
        'guess_made',
    ];

    private const IN_APP = [
        '/MessengerForiOS|MessengerLiteForiOS|Orca-Android/i' => 'messenger',
        '/Instagram/i' => 'instagram',
        '/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i' => 'facebook',
        '/musical_ly|BytedanceWebview|TikTok/i' => 'tiktok',
        '/\bLine\//i' => 'line',
    ];

    public function __construct(private readonly Questionnaire $questionnaire) {}

    public function isBot(?string $userAgent): bool
    {
        return $userAgent === null || $userAgent === ''
            || (bool) preg_match('/bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python/i', $userAgent);
    }

    /**
     * Browser-sent attribution → bounded, safe values, plus device info from the User-Agent.
     *
     * @param  array<string, mixed>  $input
     * @return array{visitor_id: ?string, source: string, medium: ?string, campaign: ?string, referrer: ?string, device: string, in_app: ?string}
     */
    public function context(array $input, ?string $userAgent): array
    {
        $visitor = $input['visitor_id'] ?? null;
        $referrer = is_string($input['referrer'] ?? null) ? mb_strtolower(trim($input['referrer'])) : '';

        return [
            'visitor_id' => is_string($visitor) && preg_match('/^[a-z0-9]{16,40}$/', $visitor) ? $visitor : null,
            'source' => $this->label($input['source'] ?? null, 60) ?? 'direct',
            'medium' => $this->label($input['medium'] ?? null, 60),
            'campaign' => $this->label($input['campaign'] ?? null, 100),
            'referrer' => preg_match('/^[a-z0-9.-]{1,100}$/', $referrer) ? $referrer : null,
            ...$this->device($userAgent ?? ''),
        ];
    }

    /**
     * Coarse audience segment from validated answers.
     *
     * @param  array<string, string|null>  $answers
     * @return array{track: string, stage: ?string, gender: ?string, age: ?string}
     */
    public function segment(array $answers): array
    {
        return [
            'track' => $this->questionnaire->track($answers),
            'stage' => $answers['basics_type'] ?? null,
            'gender' => $answers['basics_gender'] ?? null,
            'age' => $answers['basics_age'] ?? null,
        ];
    }

    /**
     * Record one event. Analytics must never break the product, so failures are only logged.
     *
     * @param  array<string, mixed>  $context  output of context(), optionally merged with segment()
     */
    public function record(string $name, array $context, ?string $step = null, ?int $amount = null): void
    {
        try {
            $now = now();
            DB::table('analytics_events')->insert([
                'name' => $name,
                'visitor_id' => $context['visitor_id'] ?? null,
                'day' => $now->copy()->setTimezone($this->timezone())->toDateString(),
                'source' => $context['source'] ?? 'direct',
                'medium' => $context['medium'] ?? null,
                'campaign' => $context['campaign'] ?? null,
                'referrer' => $context['referrer'] ?? null,
                'device' => $context['device'] ?? null,
                'in_app' => $context['in_app'] ?? null,
                'track' => $context['track'] ?? null,
                'stage' => $context['stage'] ?? null,
                'gender' => $context['gender'] ?? null,
                'age' => $context['age'] ?? null,
                'step' => $step,
                'amount' => $amount,
                'created_at' => $now,
            ]);
        } catch (Throwable $e) {
            Log::warning('Analytics event not recorded.', ['event' => $name, 'error' => class_basename($e)]);
        }
    }

    /** Record a server-side event for an assessment, reusing the context captured at submission. */
    public function recordForAssessment(string $name, Assessment $assessment, ?int $amount = null): void
    {
        $this->record($name, $assessment->analytics_json ?? ['source' => 'unknown'], amount: $amount);
    }

    // -------------------------------------------------------------------------
    // Dashboard
    // -------------------------------------------------------------------------

    /**
     * Everything the dashboard shows for the last $days days (and the period before, for deltas).
     *
     * @return array<string, mixed>
     */
    public function dashboard(int $days): array
    {
        $to = now($this->timezone())->startOfDay();
        $from = $to->copy()->subDays($days - 1);
        $prevTo = $from->copy()->subDay();
        $prevFrom = $prevTo->copy()->subDays($days - 1);

        return [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'days' => $days, 'timezone' => $this->timezone()],
            'currency' => config('soulmate.currency', 'MNT'),
            'kpis' => $this->kpis($from, $to),
            'previous' => $this->kpis($prevFrom, $prevTo),
            'daily' => $this->daily($from, $to),
            'channels' => $this->channels($from, $to),
            'audience' => [
                'stage' => $this->audience('stage', $from, $to),
                'gender' => $this->audience('gender', $from, $to),
                'age' => $this->audience('age', $from, $to),
                'track' => $this->audience('track', $from, $to),
            ],
            'devices' => $this->devices($from, $to),
            'questions' => $this->questionReach($from, $to),
            'sharing' => $this->sharing($from, $to),
            'quality' => $this->quality($from, $to),
        ];
    }

    /** @return array<string, int|float> */
    private function kpis(Carbon $from, Carbon $to): array
    {
        $byName = $this->events($from, $to)
            ->selectRaw('name, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS v, COALESCE(SUM(amount), 0) AS revenue')
            ->groupBy('name')
            ->get()
            ->keyBy('name');

        $visitors = (int) $this->events($from, $to)->whereIn('name', self::CLIENT_EVENTS)->distinct()->count('visitor_id');
        $paid = (int) ($byName['payment_confirmed']->n ?? 0);
        $revenue = (int) ($byName['payment_confirmed']->revenue ?? 0);

        return [
            'visitors' => $visitors,
            'started' => (int) ($byName['check_started']->v ?? 0),
            'completed' => (int) ($byName['check_completed']->v ?? 0),
            'checkouts' => (int) ($byName['checkout_started']->n ?? 0),
            'paid' => $paid,
            'report_viewers' => (int) ($byName['report_viewed']->v ?? 0),
            'test_unlocks' => (int) ($byName['test_unlock']->n ?? 0),
            'revenue' => $revenue,
            'conversion' => $visitors > 0 ? round($paid / $visitors, 4) : 0,
            'revenue_per_visitor' => $visitors > 0 ? round($revenue / $visitors, 1) : 0,
        ];
    }

    /** @return list<array{day: string, visitors: int, completed: int, paid: int, revenue: int}> */
    private function daily(Carbon $from, Carbon $to): array
    {
        $visitors = $this->events($from, $to)
            ->whereIn('name', self::CLIENT_EVENTS)
            ->selectRaw('day, COUNT(DISTINCT visitor_id) AS v')
            ->groupBy('day')
            ->pluck('v', 'day');

        $events = $this->events($from, $to)
            ->whereIn('name', ['check_completed', 'payment_confirmed'])
            ->selectRaw('day, name, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS v, COALESCE(SUM(amount), 0) AS revenue')
            ->groupBy('day', 'name')
            ->get();

        $rows = [];
        for ($day = $from->copy(); $day->lte($to); $day->addDay()) {
            $key = $day->toDateString();
            $rows[$key] = ['day' => $key, 'visitors' => (int) ($visitors[$key] ?? 0), 'completed' => 0, 'paid' => 0, 'revenue' => 0];
        }
        foreach ($events as $e) {
            $key = substr((string) $e->day, 0, 10);
            if (! isset($rows[$key])) {
                continue;
            }
            if ($e->name === 'check_completed') {
                $rows[$key]['completed'] = (int) $e->v;
            } else {
                $rows[$key]['paid'] = (int) $e->n;
                $rows[$key]['revenue'] = (int) $e->revenue;
            }
        }

        return array_values($rows);
    }

    /** Conversion and revenue per first-touch source / medium / campaign. */
    private function channels(Carbon $from, Carbon $to): array
    {
        $dims = ['source', 'medium', 'campaign'];
        $key = fn ($row) => implode('|', array_map(fn ($d) => $row->{$d} ?? '', $dims));

        $rows = [];
        $visitors = $this->events($from, $to)
            ->whereIn('name', self::CLIENT_EVENTS)
            ->selectRaw('source, medium, campaign, COUNT(DISTINCT visitor_id) AS v')
            ->groupBy(...$dims)
            ->get();
        foreach ($visitors as $r) {
            $rows[$key($r)] = [
                'source' => $r->source, 'medium' => $r->medium, 'campaign' => $r->campaign,
                'visitors' => (int) $r->v, 'started' => 0, 'completed' => 0, 'checkouts' => 0, 'paid' => 0, 'revenue' => 0,
            ];
        }

        $steps = $this->events($from, $to)
            ->whereIn('name', ['check_started', 'check_completed', 'checkout_started', 'payment_confirmed'])
            ->selectRaw('source, medium, campaign, name, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS v, COALESCE(SUM(amount), 0) AS revenue')
            ->groupBy('source', 'medium', 'campaign', 'name')
            ->get();
        foreach ($steps as $r) {
            $k = $key($r);
            $rows[$k] ??= [
                'source' => $r->source, 'medium' => $r->medium, 'campaign' => $r->campaign,
                'visitors' => 0, 'started' => 0, 'completed' => 0, 'checkouts' => 0, 'paid' => 0, 'revenue' => 0,
            ];
            match ($r->name) {
                'check_started' => $rows[$k]['started'] = (int) $r->v,
                'check_completed' => $rows[$k]['completed'] = (int) $r->v,
                'checkout_started' => $rows[$k]['checkouts'] = (int) $r->n,
                'payment_confirmed' => [$rows[$k]['paid'], $rows[$k]['revenue']] = [(int) $r->n, (int) $r->revenue],
            };
        }

        usort($rows, fn ($a, $b) => [$b['revenue'], $b['paid'], $b['visitors']] <=> [$a['revenue'], $a['paid'], $a['visitors']]);

        return array_slice($rows, 0, 50);
    }

    /** Who unlocks and who pays, by one segment dimension (server-side events only). */
    private function audience(string $dimension, Carbon $from, Carbon $to): array
    {
        $rows = $this->events($from, $to)
            ->whereIn('name', ['checkout_started', 'payment_confirmed'])
            ->selectRaw("{$dimension} AS value, name, COUNT(*) AS n, COALESCE(SUM(amount), 0) AS revenue")
            ->groupBy($dimension, 'name')
            ->get();

        $out = [];
        foreach ($rows as $r) {
            $value = $r->value ?? 'unknown';
            $out[$value] ??= ['value' => $value, 'checkouts' => 0, 'paid' => 0, 'revenue' => 0];
            if ($r->name === 'checkout_started') {
                $out[$value]['checkouts'] = (int) $r->n;
            } else {
                $out[$value]['paid'] = (int) $r->n;
                $out[$value]['revenue'] = (int) $r->revenue;
            }
        }
        usort($out, fn ($a, $b) => [$b['checkouts'], $b['paid']] <=> [$a['checkouts'], $a['paid']]);

        return $out;
    }

    /** Visitors and payers per device and in-app browser. */
    private function devices(Carbon $from, Carbon $to): array
    {
        $rows = $this->events($from, $to)
            ->whereIn('name', [...self::CLIENT_EVENTS, 'payment_confirmed'])
            ->selectRaw("device, COALESCE(in_app, '') AS in_app, name = 'payment_confirmed' AS is_payment, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS v")
            ->groupBy('device', DB::raw("COALESCE(in_app, '')"), DB::raw("name = 'payment_confirmed'"))
            ->get();

        $out = [];
        foreach ($rows as $r) {
            $k = ($r->device ?? 'unknown').'|'.$r->in_app;
            $out[$k] ??= ['device' => $r->device ?? 'unknown', 'in_app' => $r->in_app !== '' ? $r->in_app : null, 'visitors' => 0, 'paid' => 0];
            if ((int) $r->is_payment === 1) {
                $out[$k]['paid'] += (int) $r->n;
            } else {
                $out[$k]['visitors'] += (int) $r->v;
            }
        }
        usort($out, fn ($a, $b) => $b['visitors'] <=> $a['visitors']);

        return $out;
    }

    /** How many people answered each question, per flow — the dashboard turns this into drop-off. */
    private function questionReach(Carbon $from, Carbon $to): array
    {
        return $this->events($from, $to)
            ->where('name', 'question_answered')
            ->selectRaw("COALESCE(track, '') AS track, step, COUNT(DISTINCT visitor_id) AS v")
            ->groupBy(DB::raw("COALESCE(track, '')"), 'step')
            ->get()
            ->map(fn ($r) => ['track' => $r->track !== '' ? $r->track : null, 'question' => $r->step, 'visitors' => (int) $r->v])
            ->all();
    }

    /**
     * The word-of-mouth loop: who shared, how, and what those shares brought back
     * (visitors whose first touch was a shared link — utm_source=share).
     *
     * @return array<string, mixed>
     */
    private function sharing(Carbon $from, Carbon $to): array
    {
        $byMethod = $this->events($from, $to)
            ->where('name', 'share_completed')
            ->selectRaw("COALESCE(step, 'unknown') AS method, COUNT(*) AS n")
            ->groupBy(DB::raw("COALESCE(step, 'unknown')"))
            ->orderByDesc('n')
            ->get()
            ->map(fn ($r) => ['method' => $r->method, 'shares' => (int) $r->n])
            ->all();

        $fromShare = $this->events($from, $to)->where('source', 'share');
        $bySharedVia = (clone $fromShare)
            ->whereIn('name', self::CLIENT_EVENTS)
            ->selectRaw("COALESCE(medium, 'unknown') AS method, COUNT(DISTINCT visitor_id) AS v")
            ->groupBy(DB::raw("COALESCE(medium, 'unknown')"))
            ->pluck('v', 'method');

        return [
            'opened' => (int) $this->events($from, $to)->where('name', 'share_opened')->distinct()->count('visitor_id'),
            'sharers' => (int) $this->events($from, $to)->where('name', 'share_completed')->distinct()->count('visitor_id'),
            'shares' => (int) $this->events($from, $to)->where('name', 'share_completed')->count(),
            'by_method' => array_map(fn ($row) => $row + ['visitors' => (int) ($bySharedVia[$row['method']] ?? 0)], $byMethod),
            'visitors' => (int) (clone $fromShare)->whereIn('name', self::CLIENT_EVENTS)->distinct()->count('visitor_id'),
            'paid' => (int) (clone $fromShare)->where('name', 'payment_confirmed')->count(),
            'revenue' => (int) (clone $fromShare)->where('name', 'payment_confirmed')->sum('amount'),
            // The guessing game: shared → opened by friends → guessed → friends starting their own check.
            'guess' => [
                'shared' => (int) $this->events($from, $to)->where('name', 'share_completed')->whereIn('step', ['guess_native', 'guess_story', 'guess_messenger', 'guess_copy'])->count(),
                'opened' => (int) $this->events($from, $to)->where('name', 'guess_opened')->distinct()->count('visitor_id'),
                'guesses' => (int) $this->events($from, $to)->where('name', 'guess_made')->count(),
                'correct' => (int) $this->events($from, $to)->where('name', 'guess_made')->where('step', 'correct')->count(),
                'started_check' => (int) (clone $fromShare)->where('campaign', 'guess')->where('name', 'check_started')->distinct()->count('visitor_id'),
            ],
        ];
    }

    /** Report delivery and repeat check-ins, from assessments. */
    private function quality(Carbon $from, Carbon $to): array
    {
        [$start, $end] = [$from->copy()->utc(), $to->copy()->endOfDay()->utc()];

        $paidInRange = Assessment::whereBetween('paid_at', [$start, $end]);

        return [
            'reports_completed' => (clone $paidInRange)->where('status', AssessmentStatus::Completed)->count(),
            'reports_failed' => (clone $paidInRange)->where('status', AssessmentStatus::Failed)->count(),
            'repeat_checkins' => (clone $paidInRange)->whereNotNull('previous_assessment_id')->count(),
        ];
    }

    private function events(Carbon $from, Carbon $to): Builder
    {
        return DB::table('analytics_events')->whereBetween('day', [$from->toDateString(), $to->toDateString()]);
    }

    private function timezone(): string
    {
        return (string) config('soulmate.analytics_timezone', 'Asia/Ulaanbaatar');
    }

    private function label(mixed $value, int $max): ?string
    {
        if (! is_string($value)) {
            return null;
        }
        $clean = preg_replace('/[^\p{L}\p{N}._+\- ]/u', '', mb_strtolower(trim($value))) ?? '';

        return $clean === '' ? null : mb_substr($clean, 0, $max);
    }

    /** @return array{device: string, in_app: ?string} */
    private function device(string $userAgent): array
    {
        $device = match (true) {
            (bool) preg_match('/iPad|Tablet|Android(?!.*Mobile)/i', $userAgent) => 'tablet',
            (bool) preg_match('/Mobi|iPhone|iPod|Android/i', $userAgent) => 'mobile',
            default => 'desktop',
        };
        $inApp = null;
        foreach (self::IN_APP as $pattern => $app) {
            if (preg_match($pattern, $userAgent)) {
                $inApp = $app;
                break;
            }
        }

        return ['device' => $device, 'in_app' => $inApp];
    }
}

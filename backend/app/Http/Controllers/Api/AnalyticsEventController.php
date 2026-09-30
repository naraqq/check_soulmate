<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class AnalyticsEventController extends Controller
{
    public function __construct(private readonly Analytics $analytics) {}

    /** POST /api/events — an anonymous browser event. Bots are accepted but not recorded. */
    public function store(Request $request): Response
    {
        $data = $request->validate([
            'name' => ['required', 'string', Rule::in(Analytics::CLIENT_EVENTS)],
            'question' => ['nullable', 'string', 'regex:/^[a-z0-9_]{1,40}$/'],
            // Share placement / method (share_opened, share_completed).
            'detail' => ['nullable', 'string', 'regex:/^[a-z0-9_]{1,40}$/'],
            'track' => ['nullable', 'string', Rule::in(['early', 'couple'])],
            'attribution' => ['nullable', 'array'],
            'attribution.visitor_id' => ['nullable', 'string', 'max:40'],
            'attribution.source' => ['nullable', 'string', 'max:200'],
            'attribution.medium' => ['nullable', 'string', 'max:200'],
            'attribution.campaign' => ['nullable', 'string', 'max:200'],
            'attribution.referrer' => ['nullable', 'string', 'max:200'],
        ]);

        if (! $this->analytics->isBot($request->userAgent())) {
            $context = $this->analytics->context($data['attribution'] ?? [], $request->userAgent());
            $context['track'] = $data['track'] ?? null;
            $this->analytics->record($data['name'], $context, step: $data['question'] ?? $data['detail'] ?? null);
        }

        return response()->noContent();
    }
}

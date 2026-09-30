import { detectInAppBrowser } from './inAppBrowser'

/**
 * Privacy-safe, first-party analytics. Events go to our own backend
 * (POST /api/events) and carry only coarse, non-sensitive data: a random
 * browser id, first-touch attribution (UTM / referrer) and, for question
 * events, which question was reached. Never answers, teaser content or tokens.
 *
 * The owner's dashboard lives at /admin (see pages/AdminPage.tsx).
 */

export type AnalyticsEvent =
  | { name: 'landing_viewed' }
  | { name: 'check_started' }
  | { name: 'question_answered'; props: { index: number; total: number; question: string; track?: 'early' | 'couple' } }
  | { name: 'check_completed'; props?: { track?: 'early' | 'couple' } }
  | { name: 'paywall_viewed' }
  | { name: 'payment_started' }
  | { name: 'payment_confirmed' }
  | { name: 'report_viewed' }
  | { name: 'assessment_deleted' }
  | { name: 'share_opened'; props: { detail: 'teaser' | 'report' | 'guess' } }
  | { name: 'share_completed'; props: { detail: string } }
  | { name: 'guess_opened' }
  | { name: 'guess_made'; props: { detail: 'correct' | 'wrong' } }

/** First-touch acquisition, sent with every event and with the submitted check. */
export interface Attribution {
  visitor_id: string
  source: string
  medium?: string
  campaign?: string
  referrer?: string
}

const ATTRIBUTION_KEY = 'lemony.attribution.v1'
/** A new campaign click replaces first-touch attribution only after this long. */
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Verified server-side instead (payment_confirmed) — the browser's copy would double count. */
const SERVER_RECORDED = new Set<AnalyticsEvent['name']>(['payment_confirmed'])

/** Known referrer hosts → a readable source name. */
const REFERRER_SOURCES: [RegExp, string, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|messenger\.com$/, 'facebook', 'social'],
  [/(^|\.)instagram\.com$/, 'instagram', 'social'],
  [/(^|\.)tiktok\.com$/, 'tiktok', 'social'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'twitter', 'social'],
  [/(^|\.)youtube\.com$/, 'youtube', 'social'],
  [/(^|\.)google\./, 'google', 'organic'],
  [/(^|\.)bing\.com$/, 'bing', 'organic'],
]

function randomId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Where this visit came from, judged from the URL, referrer and in-app browser. */
export function detectSource(url: URL, referrer: string, userAgent: string): Omit<Attribution, 'visitor_id'> | null {
  const p = url.searchParams
  const utm = p.get('utm_source')
  if (utm) {
    return { source: utm, medium: p.get('utm_medium') ?? undefined, campaign: p.get('utm_campaign') ?? undefined, referrer: hostOf(referrer) }
  }
  if (p.get('gclid')) return { source: 'google', medium: 'cpc', referrer: hostOf(referrer) }
  if (p.get('fbclid')) return { source: 'facebook', medium: 'social', referrer: hostOf(referrer) }

  const host = hostOf(referrer)
  if (host && host !== url.hostname) {
    const known = REFERRER_SOURCES.find(([pattern]) => pattern.test(host))
    return known ? { source: known[1], medium: known[2], referrer: host } : { source: host, medium: 'referral', referrer: host }
  }

  // Facebook / Instagram / TikTok in-app browsers often send no referrer at all.
  const app = detectInAppBrowser(userAgent).app
  if (app) return { source: app.toLowerCase() === 'messenger' ? 'facebook' : app.toLowerCase(), medium: 'social' }

  return null
}

function hostOf(referrer: string): string | undefined {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^www\./, '') : undefined
  } catch {
    return undefined
  }
}

let cached: Attribution | null = null

/**
 * Call once on app start: keeps first-touch attribution, but lets a fresh
 * campaign click take over after 30 days. Works (per page load) without storage.
 */
export function captureAttribution(): Attribution {
  const stored = readStored()

  const detected = detectSource(new URL(window.location.href), document.referrer, navigator.userAgent)
  const expired = stored ? Date.now() - stored.at > ATTRIBUTION_TTL_MS : true

  let next: Attribution & { at: number }
  if (stored && !(detected && expired)) {
    next = stored
  } else {
    next = { visitor_id: stored?.visitor_id ?? randomId(), source: 'direct', ...detected, at: Date.now() }
  }

  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next))
  } catch {
    // Private mode etc. — attribution still works for this page load.
  }
  cached = { visitor_id: next.visitor_id, source: next.source, medium: next.medium, campaign: next.campaign, referrer: next.referrer }
  return cached
}

function readStored(): (Attribution & { at: number }) | null {
  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getAttribution(): Attribution {
  return cached ?? captureAttribution()
}

type Provider = (event: AnalyticsEvent) => void

const sendToBackend: Provider = (event) => {
  if (SERVER_RECORDED.has(event.name)) return
  const props = 'props' in event ? event.props : undefined
  const body = JSON.stringify({
    name: event.name,
    question: props && 'question' in props ? props.question : undefined,
    track: props && 'track' in props ? props.track : undefined,
    detail: props && 'detail' in props ? props.detail : undefined,
    attribution: getAttribution(),
  })
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  // keepalive: the event still arrives when the user navigates away right after.
  void fetch(`${base}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
  }).catch(() => {})
}

let provider: Provider = import.meta.env.MODE === 'test' ? () => {} : sendToBackend

export function setAnalyticsProvider(next: Provider) {
  provider = next
}

export function track(event: AnalyticsEvent) {
  try {
    if (import.meta.env.DEV) console.debug('[analytics]', event)
    provider(event)
  } catch {
    // Analytics must never break the product.
  }
}

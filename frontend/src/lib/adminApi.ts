/** Types and fetcher for the owner's analytics dashboard (GET /api/admin/analytics). */

export type RangeDays = 7 | 30 | 90 | 365

export interface Kpis {
  visitors: number
  started: number
  completed: number
  checkouts: number
  paid: number
  report_viewers: number
  test_unlocks: number
  revenue: number
  conversion: number
  revenue_per_visitor: number
}

export interface ChannelRow {
  source: string
  medium: string | null
  campaign: string | null
  visitors: number
  started: number
  completed: number
  checkouts: number
  paid: number
  revenue: number
}

export interface AudienceRow {
  value: string
  checkouts: number
  paid: number
  revenue: number
}

export interface Dashboard {
  range: { from: string; to: string; days: number; timezone: string }
  currency: string
  kpis: Kpis
  previous: Kpis
  daily: { day: string; visitors: number; completed: number; paid: number; revenue: number }[]
  channels: ChannelRow[]
  audience: Record<'stage' | 'gender' | 'age' | 'track', AudienceRow[]>
  devices: { device: string; in_app: string | null; visitors: number; paid: number }[]
  questions: { track: 'early' | 'couple' | null; question: string; visitors: number }[]
  sharing: {
    opened: number
    sharers: number
    shares: number
    by_method: { method: string; shares: number; visitors: number }[]
    visitors: number
    paid: number
    revenue: number
  }
  quality: {
    feedback: {
      responses: number
      understood: Record<string, number>
      actionable: Record<string, number>
      concern: Record<string, number>
    }
    reports_completed: number
    reports_failed: number
    repeat_checkins: number
  }
}

export class DashboardError extends Error {
  constructor(public readonly kind: 'unauthorized' | 'disabled' | 'failed') {
    super(kind)
  }
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export async function fetchDashboard(key: string, days: RangeDays): Promise<Dashboard> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/admin/analytics?days=${days}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
      credentials: 'omit',
    })
  } catch {
    throw new DashboardError('failed')
  }
  if (response.status === 401) throw new DashboardError('unauthorized')
  if (response.status === 404) throw new DashboardError('disabled')
  if (!response.ok) throw new DashboardError('failed')
  return (await response.json()) as Dashboard
}

/** Channel key used to remember ad spend per channel. */
export function channelKey(row: Pick<ChannelRow, 'source' | 'medium' | 'campaign'>): string {
  return [row.source, row.medium ?? '', row.campaign ?? ''].join('|')
}

export const ratio = (a: number, b: number) => (b > 0 ? a / b : null)

const intl = new Intl.NumberFormat('en-US')
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const num = (n: number) => intl.format(n)
export const pct = (r: number | null, digits = 1) => (r === null ? '—' : `${(r * 100).toFixed(digits)}%`)
export const money = (n: number) => `₮${n >= 100_000 ? compact.format(n) : intl.format(Math.round(n))}`

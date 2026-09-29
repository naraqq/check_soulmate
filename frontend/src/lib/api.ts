import type { Answers } from '../data/types'
import type { SignalId } from '../data/signals'

/**
 * Typed client for the Laravel API. In development Vite proxies /api to
 * Laravel; in production Nginx serves both from one origin. VITE_API_BASE_URL
 * can point elsewhere if the API lives on another host.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly body: Record<string, unknown>

  constructor(status: number, code: string, body: Record<string, unknown> = {}) {
    super(code)
    this.status = status
    this.code = code
    this.body = body
  }

  get isNetwork() {
    return this.status === 0
  }
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown): Promise<{ status: number; data: T }> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network_error')
  }

  if (response.status === 204) return { status: 204, data: undefined as T }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    const code = typeof data.code === 'string' ? data.code : response.status === 422 ? 'validation_failed' : `http_${response.status}`
    throw new ApiError(response.status, code, data)
  }

  return { status: response.status, data: data as T }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AssessmentStatus = 'created' | 'payment_pending' | 'paid' | 'generating' | 'completed' | 'failed'

export interface AppConfig {
  price: number
  currency: string
}

export interface TeaserPayload {
  strengths: SignalId[]
  explore: SignalId[]
  attention: SignalId | null
}

export interface AssessmentSummary {
  status: AssessmentStatus
  paid: boolean
  teaser: { strengths: string[]; explore: string[]; attention: string | null }
  created_at: string
}

export interface BankDeeplink {
  name: string
  description: string | null
  logo: string | null
  link: string
}

export interface InvoiceDisplay {
  qr_text: string
  qr_image: string | null
  short_url: string | null
  deeplinks: BankDeeplink[]
}

export type PaymentResponse =
  | { status: 'paid'; assessment_status: AssessmentStatus }
  | {
      status: 'pending'
      assessment_status: AssessmentStatus
      amount: number
      currency: string
      invoice: InvoiceDisplay | null
      dev_bypass: boolean
    }

export interface PaymentStatusResponse {
  status: 'paid' | 'pending'
  assessment_status: AssessmentStatus
}

export interface ReportSection {
  summary: string
  observations: string[]
}

export interface RelationshipReport {
  headline: string
  summary: string
  strengths: { title: string; description: string }[]
  areas_to_explore: { title: string; description: string; importance: 'low' | 'moderate' | 'high' }[]
  communication: ReportSection
  affection: ReportSection
  effort: ReportSection
  trust: ReportSection
  conflict: ReportSection
  independence: ReportSection
  future: ReportSection
  patterns: { title: string; description: string }[]
  conversation_starters: string[]
  closing: string
}

export type ReportState =
  | { status: 'completed'; report: RelationshipReport; created_at: string }
  | { status: 'paid' | 'generating' }

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const api = {
  config: () => request<AppConfig>('GET', '/config').then((r) => r.data),

  createAssessment: (payload: { questionnaire_version: string; answers: Answers; teaser: TeaserPayload }) =>
    request<{ token: string; status: AssessmentStatus }>('POST', '/assessments', payload).then((r) => r.data),

  getAssessment: (token: string) => request<AssessmentSummary>('GET', `/assessments/${token}`).then((r) => r.data),

  deleteAssessment: (token: string) => request<void>('DELETE', `/assessments/${token}`).then(() => undefined),

  createPayment: (token: string) => request<PaymentResponse>('POST', `/assessments/${token}/payment`).then((r) => r.data),

  paymentStatus: (token: string) =>
    request<PaymentStatusResponse>('GET', `/assessments/${token}/payment-status`).then((r) => r.data),

  devMarkPaid: (token: string) =>
    request<PaymentStatusResponse>('POST', `/assessments/${token}/dev/mark-paid`).then((r) => r.data),

  generateReport: (token: string) => request<ReportState>('POST', `/assessments/${token}/generate-report`).then((r) => r.data),

  getReport: (token: string) => request<ReportState>('GET', `/assessments/${token}/report`).then((r) => r.data),
}

/** Tokens are 48 lowercase hex characters; anything else is rejected before calling the API. */
export function isValidToken(token: string | undefined): token is string {
  return typeof token === 'string' && /^[a-f0-9]{48}$/.test(token)
}

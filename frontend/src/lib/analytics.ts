/**
 * Privacy-safe analytics abstraction. Events carry only coarse, non-sensitive
 * properties (never questions, answers, teaser content or tokens). No provider
 * is wired up yet — plug one into `setAnalyticsProvider` later.
 */

export type AnalyticsEvent =
  | { name: 'check_started' }
  | { name: 'question_answered'; props: { index: number; total: number } }
  | { name: 'check_completed'; props: { answered: number; skipped: number } }
  | { name: 'paywall_viewed' }
  | { name: 'payment_started' }
  | { name: 'payment_confirmed' }
  | { name: 'report_viewed' }
  | { name: 'assessment_deleted' }

type Provider = (event: AnalyticsEvent) => void

let provider: Provider = (event) => {
  if (import.meta.env.DEV) console.debug('[analytics]', event)
}

export function setAnalyticsProvider(next: Provider) {
  provider = next
}

export function track(event: AnalyticsEvent) {
  try {
    provider(event)
  } catch {
    // Analytics must never break the product.
  }
}

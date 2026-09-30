import type { Answers, ShowIf, Track } from './types'

/** The stage question decides which flow (and which kind of report) the user gets. */
export const STAGE_QUESTION = 'basics_type'

/** Stages where people are still getting to know each other. Everyone else is a couple. */
export const EARLY_STAGES = ['talking', 'dating']

export const SHOW_FOR: Record<Track, ShowIf> = {
  early: { question: STAGE_QUESTION, in: EARLY_STAGES },
  couple: { question: STAGE_QUESTION, notIn: EARLY_STAGES },
}

export function trackFor(answers: Answers): Track {
  const stage = answers[STAGE_QUESTION]
  return stage != null && EARLY_STAGES.includes(stage) ? 'early' : 'couple'
}

/**
 * Who a page or ad speaks to — "?for=early" (talking / dating) or "?for=couple".
 * Landing pages, shared links and ads carry it so the message matches the click.
 */
export function audienceParam(value: string | null | undefined): Track | null {
  return value === 'early' || value === 'couple' ? value : null
}

/** Whether a stage answer belongs to the chosen audience (used to narrow the stage question). */
export function stageFitsAudience(stage: string, audience: Track): boolean {
  return EARLY_STAGES.includes(stage) === (audience === 'early')
}

export function checkPath(audience: Track | null): string {
  return audience ? `/check?for=${audience}` : '/check'
}

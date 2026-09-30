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

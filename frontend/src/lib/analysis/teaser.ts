import { exploreTitles, flagPriority, patternTitles, strengthTitles, type SignalId } from '../../data/signals'
import type { AnswerFlag, Answers, AnswerOption, Question, ScoredCategoryId } from '../../data/types'

export const SCORED_CATEGORIES: ScoredCategoryId[] = [
  'communication',
  'affection',
  'effort',
  'trust',
  'conflict',
  'independence',
  'future',
]

export interface CategoryIndicator {
  category: ScoredCategoryId
  /** Weighted mean of option scores (0–1), or null when nothing was answered. Internal only — never displayed. */
  score: number | null
  answered: number
}

export interface TeaserItem {
  id: SignalId
  title: string
}

export interface Teaser {
  strengths: TeaserItem[]
  explore: TeaserItem[]
  attention: TeaserItem | null
  answeredCount: number
  skippedCount: number
}

/** Average "who usually…" balance at or below this means the user reports leading most of the time. */
const LEADING_BALANCE_THRESHOLD = -0.6

function selectedOption(question: Question, answers: Answers): AnswerOption | undefined {
  const value = answers[question.id]
  if (value == null || !question.options) return undefined
  return question.options.find((o) => o.value === value)
}

export function analyzeCategories(questions: Question[], answers: Answers): Record<ScoredCategoryId, CategoryIndicator> {
  const totals = Object.fromEntries(
    SCORED_CATEGORIES.map((c) => [c, { weighted: 0, weight: 0, answered: 0 }]),
  ) as Record<ScoredCategoryId, { weighted: number; weight: number; answered: number }>

  for (const question of questions) {
    if (question.category === 'basics') continue
    const option = selectedOption(question, answers)
    if (option?.score === undefined) continue
    const weight = question.weight ?? 1
    const bucket = totals[question.category]
    bucket.weighted += option.score * weight
    bucket.weight += weight
    bucket.answered += 1
  }

  return Object.fromEntries(
    SCORED_CATEGORIES.map((category) => {
      const { weighted, weight, answered } = totals[category]
      return [category, { category, answered, score: weight > 0 ? weighted / weight : null }]
    }),
  ) as Record<ScoredCategoryId, CategoryIndicator>
}

/** Flags raised by the selected answers, mapped to the category they came from. */
export function collectFlags(questions: Question[], answers: Answers): Map<AnswerFlag, ScoredCategoryId> {
  const flags = new Map<AnswerFlag, ScoredCategoryId>()
  const balances: number[] = []

  for (const question of questions) {
    if (question.category === 'basics') continue
    const option = selectedOption(question, answers)
    if (!option) continue
    if (option.flag && !flags.has(option.flag)) flags.set(option.flag, question.category)
    if (question.analysisTags.includes('balance') && option.balance !== undefined) balances.push(option.balance)
  }

  // Leading across many "who usually…" questions is a pattern even if no single answer was flagged.
  if (balances.length >= 3 && !flags.has('effort_imbalance') && !flags.has('initiation_imbalance')) {
    const mean = balances.reduce((a, b) => a + b, 0) / balances.length
    if (mean <= LEADING_BALANCE_THRESHOLD) flags.set('initiation_imbalance', 'effort')
  }

  return flags
}

export function countAnswers(questions: Question[], answers: Answers) {
  let answeredCount = 0
  let skippedCount = 0
  for (const question of questions) {
    const value = answers[question.id]
    if (value == null || value.trim() === '') skippedCount += 1
    else answeredCount += 1
  }
  return { answeredCount, skippedCount }
}

/**
 * The pre-payment teaser: up to 3 strengths, 2 areas to explore and 1 pattern.
 * Only titles are produced here — the explanation is what the paid report adds.
 */
export function buildTeaser(questions: Question[], answers: Answers): Teaser {
  const indicators = analyzeCategories(questions, answers)
  const flags = collectFlags(questions, answers)

  const topFlag = flagPriority.find((f) => flags.has(f))
  const flaggedCategory = topFlag ? flags.get(topFlag) : undefined

  const scored = SCORED_CATEGORIES.map((c) => indicators[c]).filter(
    (i): i is CategoryIndicator & { score: number } => i.score !== null,
  )
  // Stable ordering: by score, then by questionnaire category order.
  const byScoreDesc = [...scored].sort(
    (a, b) => b.score - a.score || SCORED_CATEGORIES.indexOf(a.category) - SCORED_CATEGORIES.indexOf(b.category),
  )

  // A category carrying the highlighted pattern is never presented as a strength.
  const strengthCats = byScoreDesc
    .filter((i) => i.category !== flaggedCategory)
    .slice(0, 3)
    .map((i) => i.category)

  const remainingAsc = byScoreDesc.filter((i) => !strengthCats.includes(i.category)).reverse()

  let attention: TeaserItem | null = null
  let exploreCats: ScoredCategoryId[]

  if (topFlag) {
    attention = { id: `pattern:${topFlag}`, title: patternTitles[topFlag] }
    exploreCats = remainingAsc.slice(0, 2).map((i) => i.category)
  } else {
    // No flagged pattern: the lowest-scoring area becomes the one "worth attention".
    const [lowest, ...rest] = remainingAsc
    if (lowest) attention = { id: `explore:${lowest.category}`, title: exploreTitles[lowest.category] }
    exploreCats = rest.slice(0, 2).map((i) => i.category)
  }

  return {
    strengths: strengthCats.map((c) => ({ id: `strength:${c}`, title: strengthTitles[c] })),
    explore: exploreCats.map((c) => ({ id: `explore:${c}`, title: exploreTitles[c] })),
    attention,
    ...countAnswers(questions, answers),
  }
}

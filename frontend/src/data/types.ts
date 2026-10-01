export type CategoryId =
  | 'basics'
  // About the person themselves (both flows, not scored)
  | 'self'
  | 'communication'
  | 'affection'
  | 'effort'
  | 'trust'
  | 'conflict'
  | 'independence'
  | 'future'
  // Early stage (talking / dating)
  | 'interest'
  | 'consistency'
  | 'connection'
  | 'intentions'
  | 'respect'
  | 'values'
  | 'feelings'

/** Categories that are scored. "basics" only provides context. */
export type ScoredCategoryId = Exclude<CategoryId, 'basics' | 'self'>

/** Sections that describe the person or situation (basics, self) are never scored. */
export function isScored(category: CategoryId): category is ScoredCategoryId {
  return category !== 'basics' && category !== 'self'
}

/**
 * Which question flow and report the user gets, decided by the relationship stage:
 * "early" for people who are talking or dating, "couple" for committed relationships.
 */
export type Track = 'early' | 'couple'

export type QuestionType = 'single_choice' | 'scale' | 'yes_no' | 'text'

/**
 * Pattern flags attached to specific answers. They describe what the user
 * reported — never a judgement about the partner or the relationship.
 */
export type AnswerFlag =
  | 'harmful_conflict'
  | 'trust_breach'
  | 'fear_of_reaction'
  | 'status_quo_unhappy'
  | 'effort_imbalance'
  | 'initiation_imbalance'
  | 'unresolved_conflict'
  | 'drifting_apart'
  | 'fidelity_worry'
  | 'emotional_dependence'
  | 'attention_seeking'
  // Early stage
  | 'boundary_pressure'
  | 'early_control'
  | 'mixed_signals'
  | 'disappearing'
  | 'fading_interest'
  | 'unclear_intentions'
  | 'intentions_mismatch'
  | 'values_mismatch'
  | 'concerning_habits'
  | 'others_concerned'
  | 'self_silencing'
  | 'overthinking'
  | 'feeling_drained'

export interface AnswerOption {
  value: string
  label: string
  /** 0–1. Higher means the answer describes a more supportive experience. */
  score?: number
  /** -1 = "mostly me" … 0 = equal … 1 = "mostly my partner". Used for "who usually…" questions. */
  balance?: number
  flag?: AnswerFlag
  /** A short, caring reply shown right after this answer is chosen (only on meaningful answers). */
  reply?: string
  /** Offer this option only when an earlier answer matches (e.g. a duration scale per stage). */
  showIf?: ShowIf
}

/** Show a question only when an earlier answer matches (or doesn't match) these values. */
export interface ShowIf {
  question: string
  in?: string[]
  notIn?: string[]
}

export interface Question {
  id: string
  category: CategoryId
  text: string
  helper?: string
  type: QuestionType
  options?: AnswerOption[]
  analysisTags: string[]
  /** Relative importance within its category. Defaults to 1. */
  weight?: number
  optional?: boolean
  placeholder?: string
  maxLength?: number
  /** Additional conditions; every rule must match. */
  visibleWhen?: ShowIf[]
  showIf?: ShowIf
}

export interface Category {
  id: CategoryId
  /** Short label shown above each question. */
  label: string
  description: string
  /** Screen shown when the user enters this section — guides them through the check. */
  intro: { title: string; text: string }
  /**
   * Shown when the user finishes this section, chosen by how the section felt overall.
   * Gentle acknowledgement only — never the report's actual findings.
   */
  outro: { high: string; mid: string; low: string }
}

/** questionId → option value (or free text). null means the user skipped it. */
export type Answers = Record<string, string | null>

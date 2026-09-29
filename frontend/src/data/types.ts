export type CategoryId =
  | 'basics'
  | 'communication'
  | 'affection'
  | 'effort'
  | 'trust'
  | 'conflict'
  | 'independence'
  | 'future'

/** Categories that are scored. "basics" only provides context. */
export type ScoredCategoryId = Exclude<CategoryId, 'basics'>

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

export interface AnswerOption {
  value: string
  label: string
  /** 0–1. Higher means the answer describes a more supportive experience. */
  score?: number
  /** -1 = "mostly me" … 0 = equal … 1 = "mostly my partner". Used for "who usually…" questions. */
  balance?: number
  flag?: AnswerFlag
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
}

export interface Category {
  id: CategoryId
  label: string
  description: string
}

/** questionId → option value (or free text). null means the user skipped it. */
export type Answers = Record<string, string | null>

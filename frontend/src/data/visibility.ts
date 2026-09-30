import type { Answers, Question, ShowIf } from './types'

/** Whether a question applies, given the answers so far (see Question.showIf). */
export function isVisible(question: Question, answers: Answers): boolean {
  return [question.showIf, ...(question.visibleWhen ?? [])].every((rule) => !rule || matches(rule, answers))
}

function matches(rule: ShowIf, answers: Answers): boolean {
  const value = answers[rule.question]
  if (value == null) return false // A follow-up requires known context.
  if (rule.in && !rule.in.includes(value)) return false
  if (rule.notIn && rule.notIn.includes(value)) return false
  return true
}

/** Answers for questions that no longer apply are dropped before analysis/submission. */
export function visibleAnswers(questions: Question[], answers: Answers): Answers {
  const result: Answers = {}
  for (const q of questions) {
    if (q.id in answers && isVisible(q, result)) result[q.id] = answers[q.id]
  }
  return result
}

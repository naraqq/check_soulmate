import type { Answers, Question } from './types'

/** Whether a question applies, given the answers so far (see Question.showIf). */
export function isVisible(question: Question, answers: Answers): boolean {
  const rule = question.showIf
  if (!rule) return true
  const value = answers[rule.question]
  if (value == null) return rule.in === undefined // unknown yet: show "notIn" questions, hide "in" questions
  if (rule.in && !rule.in.includes(value)) return false
  if (rule.notIn && rule.notIn.includes(value)) return false
  return true
}

/** Answers for questions that no longer apply are dropped before analysis/submission. */
export function visibleAnswers(questions: Question[], answers: Answers): Answers {
  const result: Answers = {}
  for (const q of questions) {
    if (q.id in answers && isVisible(q, answers)) result[q.id] = answers[q.id]
  }
  return result
}

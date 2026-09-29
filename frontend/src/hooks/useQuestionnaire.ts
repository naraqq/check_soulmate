import { useCallback, useEffect, useRef, useState } from 'react'
import { QUESTIONNAIRE_VERSION } from '../data/questions'
import type { Answers, Question } from '../data/types'
import { track } from '../lib/analytics'
import { storage } from '../lib/storage'

/** Delay before auto-advancing after a choice, so the selection is visibly acknowledged. */
export const AUTO_ADVANCE_MS = 380

interface State {
  index: number
  answers: Answers
  completed: boolean
}

function initialState(total: number): State {
  const saved = storage.loadProgress(QUESTIONNAIRE_VERSION)
  if (!saved) return { index: 0, answers: {}, completed: false }
  return {
    index: Math.min(Math.max(0, saved.currentIndex), total - 1),
    answers: saved.answers,
    completed: saved.completed,
  }
}

export function useQuestionnaire(questions: Question[]) {
  const total = questions.length
  const [state, setState] = useState<State>(() => initialState(total))
  const advanceTimer = useRef<number | undefined>(undefined)

  // Persist every change so a refresh or closed tab never loses progress.
  useEffect(() => {
    storage.saveProgress({
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      currentIndex: state.index,
      answers: state.answers,
      completed: state.completed,
    })
  }, [state])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const question = questions[state.index]

  const goTo = useCallback(
    (index: number) => {
      window.clearTimeout(advanceTimer.current)
      setState((s) => ({ ...s, index: Math.min(Math.max(0, index), total - 1) }))
    },
    [total],
  )

  const next = useCallback(() => {
    window.clearTimeout(advanceTimer.current)
    setState((s) => {
      if (s.index >= total - 1) return { ...s, completed: true }
      return { ...s, index: s.index + 1 }
    })
  }, [total])

  const back = useCallback(() => goTo(state.index - 1), [goTo, state.index])

  const setAnswer = useCallback(
    (value: string | null, { autoAdvance = false } = {}) => {
      const current = questions[state.index]
      setState((s) => ({ ...s, answers: { ...s.answers, [current.id]: value } }))

      if (autoAdvance) {
        // Position only — never the question or the answer.
        track({ name: 'question_answered', props: { index: state.index + 1, total } })
        window.clearTimeout(advanceTimer.current)
        advanceTimer.current = window.setTimeout(next, AUTO_ADVANCE_MS)
      }
    },
    [questions, state.index, total, next],
  )

  /** Record the question as intentionally skipped and move on. */
  const skip = useCallback(() => {
    const current = questions[state.index]
    setState((s) => ({ ...s, answers: { ...s.answers, [current.id]: null } }))
    next()
  }, [questions, state.index, next])

  const restart = useCallback(() => {
    window.clearTimeout(advanceTimer.current)
    storage.clearAll()
    setState({ index: 0, answers: {}, completed: false })
  }, [])

  return {
    question,
    index: state.index,
    total,
    answers: state.answers,
    value: state.answers[question.id] ?? null,
    completed: state.completed,
    isFirst: state.index === 0,
    isLast: state.index === total - 1,
    setAnswer,
    next,
    back,
    skip,
    restart,
  }
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONNAIRE_VERSION } from '../data/questions'
import type { Answers, CategoryId, Question } from '../data/types'
import { isVisible } from '../data/visibility'
import { track } from '../lib/analytics'
import { storage } from '../lib/storage'

/** Delay before auto-advancing after a choice, so the selection is visibly acknowledged. */
export const AUTO_ADVANCE_MS = 380

interface State {
  /** Index into the full questions array (always a visible question). */
  index: number
  answers: Answers
  completed: boolean
  /** Sections whose intro screen has been dismissed. */
  seenIntros: CategoryId[]
}

function initialState(total: number): State {
  const saved = storage.loadProgress(QUESTIONNAIRE_VERSION)
  if (!saved) return { index: 0, answers: {}, completed: false, seenIntros: [] }
  return {
    index: Math.min(Math.max(0, saved.currentIndex), total - 1),
    answers: saved.answers,
    completed: saved.completed,
    seenIntros: (saved.seenIntros ?? []) as CategoryId[],
  }
}

function findVisible(questions: Question[], answers: Answers, from: number, step: 1 | -1): number | null {
  for (let i = from; i >= 0 && i < questions.length; i += step) {
    if (isVisible(questions[i], answers)) return i
  }
  return null
}

export function useQuestionnaire(questions: Question[]) {
  const [state, setState] = useState<State>(() => initialState(questions.length))
  const advanceTimer = useRef<number | undefined>(undefined)

  // Persist every change so a refresh or closed tab never loses progress.
  useEffect(() => {
    storage.saveProgress({
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      currentIndex: state.index,
      answers: state.answers,
      completed: state.completed,
      seenIntros: state.seenIntros,
    })
  }, [state])

  useEffect(() => () => window.clearTimeout(advanceTimer.current), [])

  const question = questions[state.index]
  const visible = useMemo(() => questions.filter((q) => isVisible(q, state.answers)), [questions, state.answers])
  const position = Math.max(0, visible.indexOf(question))

  const next = useCallback(() => {
    window.clearTimeout(advanceTimer.current)
    setState((s) => {
      const nextIndex = findVisible(questions, s.answers, s.index + 1, 1)
      return nextIndex === null ? { ...s, completed: true } : { ...s, index: nextIndex }
    })
  }, [questions])

  const setAnswer = useCallback(
    (value: string | null, { autoAdvance = false } = {}) => {
      const current = questions[state.index]
      setState((s) => ({ ...s, answers: { ...s.answers, [current.id]: value } }))

      if (autoAdvance) {
        // Position only — never the question or the answer.
        track({ name: 'question_answered', props: { index: position + 1, total: visible.length } })
        window.clearTimeout(advanceTimer.current)
        // A caring reply stays on screen until the user continues — they read at their own pace.
        const hasReply = Boolean(current.options?.find((o) => o.value === value)?.reply)
        if (!hasReply) advanceTimer.current = window.setTimeout(next, AUTO_ADVANCE_MS)
      }
    },
    [questions, state.index, position, visible.length, next],
  )

  const dismissIntro = useCallback(() => {
    setState((s) => ({ ...s, seenIntros: [...new Set([...s.seenIntros, questions[s.index].category])] }))
  }, [questions])

  const previousIndex = findVisible(questions, state.answers, state.index - 1, -1)
  /** The section the user just finished, when the current question starts a new one. */
  const finishedCategory =
    previousIndex !== null && questions[previousIndex].category !== question.category ? questions[previousIndex].category : null

  return {
    question,
    /** 0-based position among questions that apply to this user. */
    position,
    total: visible.length,
    answers: state.answers,
    value: state.answers[question.id] ?? null,
    completed: state.completed,
    showIntro: !state.seenIntros.includes(question.category),
    finishedCategory,
    setAnswer,
    next,
    dismissIntro,
  }
}

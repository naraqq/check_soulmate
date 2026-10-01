import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QUESTIONNAIRE_VERSION } from '../data/questions'
import { STAGE_QUESTION, trackFor } from '../data/track'
import type { Answers, CategoryId, Question } from '../data/types'
import { isVisible, visibleAnswers } from '../data/visibility'
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

function initialState(questions: Question[]): State {
  const current = storage.loadProgress(QUESTIONNAIRE_VERSION)
  // This version only reordered existing questions; keep the previous version's answers.
  const saved = current ?? storage.loadProgress('2026.10.4')
  if (!saved) return { index: 0, answers: {}, completed: false, seenIntros: ['basics'] }
  const answers = visibleAnswers(questions, saved.answers)
  const nextUnanswered = questions.findIndex((q) => isVisible(q, answers) && !q.optional && answers[q.id] == null)
  return {
    index: current ? Math.min(Math.max(0, saved.currentIndex), questions.length - 1) : Math.max(0, nextUnanswered),
    answers,
    completed: saved.completed,
    seenIntros: [...new Set(['basics', ...(saved.seenIntros ?? [])])] as CategoryId[],
  }
}

function findVisible(questions: Question[], answers: Answers, from: number, step: 1 | -1): number | null {
  for (let i = from; i >= 0 && i < questions.length; i += step) {
    if (isVisible(questions[i], answers)) return i
  }
  return null
}

export function useQuestionnaire(questions: Question[]) {
  const [state, setState] = useState<State>(() => initialState(questions))
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
      setState((s) => ({ ...s, answers: visibleAnswers(questions, { ...s.answers, [current.id]: value }), completed: false }))

      if (autoAdvance) {
        // Which question was reached (for drop-off) — never the answer. The flow is known once the stage is answered.
        const answered = { ...state.answers, [current.id]: value }
        track({
          name: 'question_answered',
          props: {
            index: position + 1,
            total: visible.length,
            question: current.id,
            track: answered[STAGE_QUESTION] ? trackFor(answered) : undefined,
          },
        })
        window.clearTimeout(advanceTimer.current)
        // A caring reply stays on screen until the user continues — they read at their own pace.
        const hasReply = Boolean(current.options?.find((o) => o.value === value)?.reply)
        if (!hasReply) advanceTimer.current = window.setTimeout(next, AUTO_ADVANCE_MS)
      }
    },
    [questions, state.index, state.answers, position, visible.length, next],
  )

  /** Step back to the previous question that applies — its answer stays and can be changed. */
  const back = useCallback(() => {
    window.clearTimeout(advanceTimer.current)
    setState((s) => {
      const prev = findVisible(questions, s.answers, s.index - 1, -1)
      return prev === null ? s : { ...s, index: prev }
    })
  }, [questions])

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
    canGoBack: previousIndex !== null,
    setAnswer,
    next,
    back,
    dismissIntro,
  }
}

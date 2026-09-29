import type { Answers } from '../data/types'

/**
 * localStorage persistence for questionnaire progress and the assessment
 * token. Every access is wrapped: storage can be unavailable (private mode,
 * blocked site data) and the app must keep working without it.
 * Never store secrets here.
 */

const PROGRESS_KEY = 'soulmate.progress.v1'
const ASSESSMENT_KEY = 'soulmate.assessment.v1'

export interface StoredProgress {
  questionnaireVersion: string
  currentIndex: number
  answers: Answers
  completed: boolean
  updatedAt: string
}

export interface StoredAssessment {
  token: string
  createdAt: string
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked — progress just won't survive a refresh.
  }
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const storage = {
  loadProgress(version: string): StoredProgress | null {
    const progress = read<StoredProgress>(PROGRESS_KEY)
    if (!progress || progress.questionnaireVersion !== version || typeof progress.answers !== 'object') return null
    return progress
  },
  saveProgress(progress: Omit<StoredProgress, 'updatedAt'>) {
    write(PROGRESS_KEY, { ...progress, updatedAt: new Date().toISOString() })
  },
  clearProgress: () => remove(PROGRESS_KEY),

  /** Re-open a finished (but not yet submitted) questionnaire for editing. */
  reopenProgress(version: string) {
    const progress = read<StoredProgress>(PROGRESS_KEY)
    if (progress && progress.questionnaireVersion === version) {
      write(PROGRESS_KEY, { ...progress, completed: false, updatedAt: new Date().toISOString() })
    }
  },

  loadAssessment: () => read<StoredAssessment>(ASSESSMENT_KEY),
  saveAssessment: (token: string) => write(ASSESSMENT_KEY, { token, createdAt: new Date().toISOString() }),
  clearAssessment: () => remove(ASSESSMENT_KEY),

  /** Forget everything about the current check on this device. */
  clearAll() {
    remove(PROGRESS_KEY)
    remove(ASSESSMENT_KEY)
  },
}

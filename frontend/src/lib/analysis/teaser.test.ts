import { describe, expect, it } from 'vitest'
import { questions } from '../../data/questions'
import type { Answers, Question } from '../../data/types'
import { analyzeCategories, buildTeaser, collectFlags, countAnswers, sectionMood } from './teaser'

/** Answer every choice question with the option scoring highest (or lowest). */
function answerAll(pick: 'best' | 'worst'): Answers {
  const answers: Answers = {}
  for (const q of questions) {
    if (!q.options) continue
    const scored = q.options.filter((o) => o.score !== undefined)
    if (scored.length === 0) {
      answers[q.id] = q.options[0].value
      continue
    }
    const sorted = [...scored].sort((a, b) => (pick === 'best' ? b.score! - a.score! : a.score! - b.score!))
    answers[q.id] = sorted[0].value
  }
  return answers
}

describe('analyzeCategories', () => {
  it('scores all-supportive answers at the top of the range', () => {
    const indicators = analyzeCategories(questions, answerAll('best'))
    for (const indicator of Object.values(indicators)) {
      expect(indicator.score).toBe(1)
    }
  })

  it('ignores skipped and missing answers instead of scoring them as zero', () => {
    const answers = answerAll('best')
    answers.comm_heard = null
    delete answers.comm_interest
    const indicators = analyzeCategories(questions, answers)
    expect(indicators.communication.score).toBe(1)
    expect(indicators.communication.answered).toBe(questions.filter((q) => q.category === 'communication').length - 2)
  })

  it('returns null for a category with no answers', () => {
    expect(analyzeCategories(questions, {}).trust.score).toBeNull()
  })

  it('applies question weights', () => {
    const qs: Question[] = [
      { id: 'a', category: 'trust', text: 'A', type: 'yes_no', analysisTags: [], weight: 3, options: [{ value: 'yes', label: 'Y', score: 1 }] },
      { id: 'b', category: 'trust', text: 'B', type: 'yes_no', analysisTags: [], options: [{ value: 'no', label: 'N', score: 0 }] },
    ]
    expect(analyzeCategories(qs, { a: 'yes', b: 'no' }).trust.score).toBe(0.75)
  })
})

describe('collectFlags', () => {
  it('raises a flag from a flagged answer, tagged with its category', () => {
    const flags = collectFlags(questions, { conflict_harm: 'sometimes' })
    expect(flags.get('harmful_conflict')).toBe('conflict')
  })

  it('detects consistently leading "who usually" answers', () => {
    const flags = collectFlags(questions, {
      aff_initiates: 'mostly_me',
      effort_plans: 'mostly_me',
      conflict_reach_out: 'slightly_me',
    })
    expect(flags.has('initiation_imbalance')).toBe(true)
  })

  it('does not flag balanced answers', () => {
    expect(collectFlags(questions, answerAll('best')).size).toBe(0)
  })
})

describe('buildTeaser', () => {
  it('produces 3 strengths, 2 areas to explore and 1 pattern', () => {
    const teaser = buildTeaser(questions, answerAll('best'))
    expect(teaser.strengths).toHaveLength(3)
    expect(teaser.explore).toHaveLength(2)
    expect(teaser.attention).not.toBeNull()
  })

  it('never repeats a category across strengths and areas to explore', () => {
    const teaser = buildTeaser(questions, answerAll('worst'))
    const cats = [...teaser.strengths, ...teaser.explore].map((t) => t.id.split(':')[1])
    expect(new Set(cats).size).toBe(cats.length)
  })

  it('prioritises harmful conflict as the pattern and keeps conflict out of strengths', () => {
    const answers = answerAll('best')
    answers.conflict_harm = 'often'
    const teaser = buildTeaser(questions, answers)
    expect(teaser.attention?.id).toBe('pattern:harmful_conflict')
    expect(teaser.strengths.map((s) => s.id)).not.toContain('strength:conflict')
  })

  it('falls back to the lowest category when no pattern is flagged', () => {
    const answers = answerAll('best')
    answers.future_discussed = 'briefly' // lowers future without raising a flag
    const teaser = buildTeaser(questions, answers)
    expect(teaser.attention?.id).toBe('explore:future')
  })

  it('handles an empty questionnaire gracefully', () => {
    const teaser = buildTeaser(questions, {})
    expect(teaser.strengths).toEqual([])
    expect(teaser.explore).toEqual([])
    expect(teaser.attention).toBeNull()
    expect(teaser.answeredCount).toBe(0)
  })

  it('is deterministic', () => {
    const answers = answerAll('worst')
    expect(buildTeaser(questions, answers)).toEqual(buildTeaser(questions, answers))
  })
})

describe('sectionMood', () => {
  it('is high for supportive answers, low for difficult ones', () => {
    expect(sectionMood('communication', questions, answerAll('best'))).toBe('high')
    expect(sectionMood('communication', questions, answerAll('worst'))).toBe('low')
  })

  it('is never "high" when the section contains a flagged answer', () => {
    const answers = answerAll('best')
    answers.conflict_harm = 'once_or_twice'
    expect(sectionMood('conflict', questions, answers)).not.toBe('high')
  })

  it('treats the unscored basics section neutrally', () => {
    expect(sectionMood('basics', questions, answerAll('best'))).toBe('mid')
  })
})

describe('countAnswers', () => {
  it('counts blank text and null as skipped, but not questions that do not apply', () => {
    const counts = countAnswers(questions, { basics_duration: '1_3y', final_wish: '   ', comm_heard: null })
    expect(counts.answeredCount).toBe(1)
    // basics_quality_time only applies to couples who live together, so it isn't "skipped".
    expect(counts.skippedCount).toBe(questions.length - 2)
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildQuestionnaireExport } from './export'
import { categories, questions } from './questions'
import { trackFor } from './track'
import type { Answers } from './types'
import { isVisible } from './visibility'

/** The questions one user sees, given their stage (other context answers don't change the count much). */
function flow(stage: string) {
  const answers: Answers = { basics_type: stage }
  return questions.filter((q) => isVisible(q, answers))
}

describe('questionnaire config', () => {
  it('uses every category', () => {
    expect(new Set(questions.map((q) => q.category)).size).toBe(categories.length)
  })

  it.each([
    ['talking', 'early', ['interest', 'consistency', 'connection', 'intentions', 'respect', 'values', 'feelings']],
    ['dating', 'early', ['interest', 'consistency', 'connection', 'intentions', 'respect', 'values', 'feelings']],
    ['exclusive', 'couple', ['communication', 'affection', 'effort', 'trust', 'conflict', 'independence', 'future']],
    ['married', 'couple', ['communication', 'affection', 'effort', 'trust', 'conflict', 'independence', 'future']],
  ])('gives "%s" the %s flow: 35–50 questions across basics + its 7 sections', (stage, track, sections) => {
    const shown = flow(stage)
    expect(trackFor({ basics_type: stage })).toBe(track)
    expect(shown.length).toBeGreaterThanOrEqual(35)
    expect(shown.length).toBeLessThanOrEqual(50)
    expect([...new Set(shown.map((q) => q.category))]).toEqual(['basics', 'self', ...sections])
  })

  it('uses unique question ids and unique option values per question', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length)
    for (const q of questions) {
      const values = (q.options ?? []).map((o) => o.value)
      expect(new Set(values).size, q.id).toBe(values.length)
    }
  })

  it('gives every choice question options, and scores in 0–1 outside basics', () => {
    for (const q of questions) {
      if (q.type === 'text') continue
      expect(q.options?.length, q.id).toBeGreaterThanOrEqual(2)
      for (const o of q.options ?? []) {
        // Unscored options mean "doesn't apply yet" (e.g. "hasn't come up") and are simply not counted.
        if (q.category === 'basics' || q.category === 'self' || o.score === undefined) continue
        expect(o.score, `${q.id}.${o.value}`).toBeGreaterThanOrEqual(0)
        expect(o.score, `${q.id}.${o.value}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('starts with questions about the user, then the relationship stage', () => {
    expect(questions.slice(0, 3).map((q) => q.id)).toEqual(['basics_gender', 'basics_age', 'basics_type'])
  })

  it.each([
    ['exclusive', 'future_three_years', 'final_wish'],
    ['talking', 'feel_three_months', 'early_final'],
  ])('ends the "%s" flow with the "stays like this" question and an optional reflection', (stage, beforeLast, last) => {
    const shown = flow(stage)
    expect(shown.at(-2)?.id).toBe(beforeLast)
    expect(shown.at(-1)).toMatchObject({ id: last, type: 'text', optional: true })
  })

  it('asks people who are only talking about chatting, not about how often they meet', () => {
    const ids = flow('talking').map((q) => q.id)
    expect(ids).toContain('basics_met_in_person')
    expect(ids).not.toContain('basics_frequency')
    expect(flow('dating').map((q) => q.id)).toContain('basics_frequency')
  })

  it('is in sync with the backend copy (run `npm run export:questions` if this fails)', () => {
    const backendPath = resolve(__dirname, '../../../backend/resources/questionnaire/questions.json')
    const backend = JSON.parse(readFileSync(backendPath, 'utf8'))
    expect(backend).toEqual(buildQuestionnaireExport())
  })
})

describe('complete adaptive paths', () => {
  function walk(stage: string, needsFollowUps: boolean) {
    const answers: Answers = {
      basics_type: stage,
      basics_duration: '1_3y',
      basics_met_in_person: 'regularly',
      checkin_communication: needsFollowUps ? 'rarely' : 'often',
      checkin_effort: needsFollowUps ? 'rarely' : 'often',
      checkin_boundaries: needsFollowUps ? 'rarely' : 'often',
    }
    const shown: string[] = []
    for (const q of questions) {
      if (!isVisible(q, answers)) continue
      shown.push(q.id)
      if (answers[q.id] || q.type === 'text') continue
      const options = [...(q.options ?? [])]
      options.sort((a, b) => needsFollowUps ? (a.score ?? 0.5) - (b.score ?? 0.5) : (b.score ?? 0.5) - (a.score ?? 0.5))
      answers[q.id] = options[0]?.value ?? null
    }
    return { shown, answers }
  }

  it.each(['talking', 'dating', 'exclusive', 'living_together', 'engaged', 'married'])('keeps the %s flow shorter when follow-ups are unnecessary', (stage) => {
    const supportive = walk(stage, false)
    const concerns = walk(stage, true)
    expect(concerns.shown.length - supportive.shown.length).toBeGreaterThanOrEqual(4)
    expect(supportive.shown.length).toBeLessThanOrEqual(50)
    expect(supportive.shown).toContain('checkin_communication')
    expect(supportive.shown).toContain('checkin_effort')
    expect(supportive.shown).toContain('checkin_boundaries')
    expect(supportive.shown.at(-1)).toBe(['talking', 'dating'].includes(stage) ? 'early_final' : 'final_wish')
  })
})

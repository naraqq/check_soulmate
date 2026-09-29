import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildQuestionnaireExport } from './export'
import { categories, questions } from './questions'

describe('questionnaire config', () => {
  it('has roughly 35–45 questions across all 8 categories', () => {
    expect(questions.length).toBeGreaterThanOrEqual(35)
    expect(questions.length).toBeLessThanOrEqual(45)
    expect(new Set(questions.map((q) => q.category)).size).toBe(categories.length)
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
        if (q.category === 'basics') continue
        expect(o.score, `${q.id}.${o.value}`).toBeGreaterThanOrEqual(0)
        expect(o.score, `${q.id}.${o.value}`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('starts with questions about the user, then the relationship stage', () => {
    expect(questions.slice(0, 3).map((q) => q.id)).toEqual(['basics_gender', 'basics_age', 'basics_type'])
  })

  it('ends with the three-year question followed by the optional reflection', () => {
    expect(questions.at(-2)?.id).toBe('future_three_years')
    expect(questions.at(-1)).toMatchObject({ id: 'final_wish', type: 'text', optional: true })
  })

  it('is in sync with the backend copy (run `npm run export:questions` if this fails)', () => {
    const backendPath = resolve(__dirname, '../../../backend/resources/questionnaire/questions.json')
    const backend = JSON.parse(readFileSync(backendPath, 'utf8'))
    expect(backend).toEqual(buildQuestionnaireExport())
  })
})

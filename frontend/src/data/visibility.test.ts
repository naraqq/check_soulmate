import { describe, expect, it } from 'vitest'
import { categories, questions } from './questions'
import { isVisible, visibleAnswers } from './visibility'

const byId = (id: string) => questions.find((q) => q.id === id)!

describe('conditional questions', () => {
  it('asks how often they meet when they do not live together', () => {
    expect(isVisible(byId('basics_frequency'), { basics_type: 'dating' })).toBe(true)
    expect(isVisible(byId('basics_quality_time'), { basics_type: 'dating' })).toBe(false)
  })

  it('asks about quality time instead when living together or married', () => {
    for (const stage of ['living_together', 'married']) {
      expect(isVisible(byId('basics_frequency'), { basics_type: stage })).toBe(false)
      expect(isVisible(byId('basics_quality_time'), { basics_type: stage })).toBe(true)
    }
  })

  it('drops answers to questions that no longer apply', () => {
    const answers = visibleAnswers(questions, { basics_type: 'married', basics_frequency: 'weekly', basics_quality_time: 'rarely' })
    expect(answers).toEqual({ basics_type: 'married', basics_quality_time: 'rarely' })
  })

  it('only references earlier questions', () => {
    questions.forEach((q, i) => {
      if (!q.showIf) return
      const target = questions.findIndex((x) => x.id === q.showIf!.question)
      expect(target, q.id).toBeGreaterThanOrEqual(0)
      expect(target, q.id).toBeLessThan(i)
    })
  })
})

describe('section intros', () => {
  it('every category has an intro and an end-of-section reflection for every mood', () => {
    for (const c of categories) {
      expect(c.intro.title.length, c.id).toBeGreaterThan(0)
      expect(c.intro.text.length, c.id).toBeGreaterThan(0)
      for (const mood of ['high', 'mid', 'low'] as const) expect(c.outro[mood].length, `${c.id}.${mood}`).toBeGreaterThan(0)
    }
  })

  it('replies are short enough to read before auto-advancing', () => {
    for (const q of questions) {
      for (const o of q.options ?? []) {
        if (o.reply) expect(o.reply.length, `${q.id}.${o.value}`).toBeLessThanOrEqual(110)
      }
    }
  })
})

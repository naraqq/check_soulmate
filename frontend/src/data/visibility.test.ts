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

describe('stage and experience follow-ups', () => {
  it('does not show a track before the stage is known', () => {
    expect(isVisible(byId('comm_initiates'), {})).toBe(false)
    expect(isVisible(byId('int_initiates'), {})).toBe(false)
  })

  it('asks about real meetings only after meeting, and only on the early track', () => {
    expect(isVisible(byId('int_plans'), { basics_type: 'talking', basics_met_in_person: 'not_yet' })).toBe(false)
    expect(isVisible(byId('int_plans'), { basics_type: 'dating', basics_met_in_person: 'once' })).toBe(true)
    expect(isVisible(byId('int_plans'), { basics_type: 'married', basics_met_in_person: 'once' })).toBe(false)
  })

  it('does not ask for a trend or introductions in the first month', () => {
    for (const id of ['cons_trend', 'intent_public']) {
      expect(isVisible(byId(id), { basics_type: 'talking', basics_duration: 'lt_1m' })).toBe(false)
      expect(isVisible(byId(id), { basics_type: 'dating', basics_duration: '1_3m' })).toBe(true)
    }
  })

  it('removes stale repair answers when the user changes their conflict experience', () => {
    const answers = { basics_type: 'married', conflict_frequency: 'never', conflict_after: 'unresolved' }
    expect(visibleAnswers(questions, answers)).not.toHaveProperty('conflict_after')
    expect(isVisible(byId('conflict_harm'), answers)).toBe(true)
    expect(isVisible(byId('conflict_after'), { ...answers, conflict_frequency: 'monthly' })).toBe(true)
  })

  it('asks about marriage readiness only when engaged', () => {
    expect(isVisible(byId('future_readiness'), { basics_type: 'engaged' })).toBe(true)
    expect(isVisible(byId('future_readiness'), { basics_type: 'married' })).toBe(false)
    expect(isVisible(byId('future_shared_decisions'), { basics_type: 'living_together' })).toBe(true)
    expect(isVisible(byId('future_shared_decisions'), { basics_type: 'talking' })).toBe(false)
  })

  it('uses only earlier context for additional conditions', () => {
    questions.forEach((q, index) => {
      for (const rule of q.visibleWhen ?? []) {
        const source = questions.findIndex((candidate) => candidate.id === rule.question)
        expect(source).toBeGreaterThanOrEqual(0)
        expect(source).toBeLessThan(index)
      }
    })
  })
})

describe('focused follow-ups', () => {
  it('asks about a lack of reciprocity only when the earlier experience calls for it', () => {
    expect(isVisible(byId('comm_if_not_first'), { basics_type: 'married', comm_initiates: 'equal' })).toBe(false)
    expect(isVisible(byId('comm_if_not_first'), { basics_type: 'married', comm_initiates: 'mostly_me' })).toBe(true)
    expect(isVisible(byId('comm_begging'), { basics_type: 'married', checkin_effort: 'often' })).toBe(false)
    expect(isVisible(byId('comm_begging'), { basics_type: 'married', checkin_effort: 'rarely' })).toBe(true)
  })

  it('removes an entire chain of obsolete follow-ups in one pass', () => {
    const answers = visibleAnswers(questions, {
      basics_type: 'married', checkin_effort: 'often', effort_more: 'almost_always', effort_one_week: 'fall_apart',
    })
    expect(answers).not.toHaveProperty('effort_more')
    expect(answers).not.toHaveProperty('effort_one_week')
  })

  it('every follow-up matches a real option on an earlier question', () => {
    for (const q of questions) {
      for (const rule of [q.showIf, ...(q.visibleWhen ?? [])]) {
        if (!rule) continue
        const source = byId(rule.question)
        for (const value of [...(rule.in ?? []), ...(rule.notIn ?? [])]) {
          expect(source.options?.map((option) => option.value), `${q.id}: ${value}`).toContain(value)
        }
      }
    }
  })

  it('keeps safety questions visible even when other experiences are supportive', () => {
    const answers = { basics_type: 'dating', checkin_boundaries: 'almost_always', checkin_effort: 'almost_always' }
    expect(isVisible(byId('resp_pressure'), answers)).toBe(true)
    expect(isVisible(byId('resp_control'), answers)).toBe(true)
    expect(isVisible(byId('conflict_harm'), { ...answers, basics_type: 'married' })).toBe(true)
  })
})

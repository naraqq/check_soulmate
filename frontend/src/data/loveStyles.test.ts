import { describe, expect, it } from 'vitest'
import { LOVE_STYLES, loveStyleFor, type LoveStyleId } from './loveStyles'
import { questions } from './questions'
import { visibleAnswers } from './visibility'

function randomAnswers(stage: string, rand: () => number) {
  const answers: Record<string, string> = { basics_type: stage }
  for (const q of questions) {
    if (q.options && !(q.id in answers)) answers[q.id] = q.options[Math.floor(rand() * q.options.length)].value
  }
  return visibleAnswers(questions, answers)
}

describe('loveStyleFor', () => {
  it.each([
    ['talking', 'early'],
    ['married', 'couple'],
  ] as const)('gives every %s type a fair share — no type dominates or disappears', (stage, track) => {
    let seed = 7
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const counts: Partial<Record<LoveStyleId, number>> = {}
    const runs = 1500
    for (let i = 0; i < runs; i++) {
      const id = loveStyleFor(questions, randomAnswers(stage, rand), track).id
      counts[id] = (counts[id] ?? 0) + 1
    }
    const expected = (Object.keys(LOVE_STYLES) as LoveStyleId[]).filter((id) => track === 'early' || id !== 'seeker')
    for (const id of expected) {
      const share = (counts[id] ?? 0) / runs
      expect(share, id).toBeGreaterThan(0.08)
      expect(share, id).toBeLessThan(0.32)
    }
  })

  it('is stable for the same answers', () => {
    let seed = 3
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const answers = randomAnswers('dating', rand)
    expect(loveStyleFor(questions, answers, 'early')).toEqual(loveStyleFor(questions, answers, 'early'))
  })

  it('always returns a type, even with no answers', () => {
    expect(LOVE_STYLES[loveStyleFor(questions, {}, 'couple').id]).toBeDefined()
  })

  it('keeps every type short enough for a story card', () => {
    for (const style of Object.values(LOVE_STYLES)) {
      expect(style.name.length).toBeLessThanOrEqual(16)
      expect(style.traits.every((t) => t.length <= 32)).toBe(true)
    }
  })
})

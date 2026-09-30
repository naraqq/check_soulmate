import { describe, expect, it } from 'vitest'
import { questions } from './questions'
import { audienceParam, checkPath, STAGE_QUESTION, stageFitsAudience } from './track'

describe('audience doors', () => {
  it('accepts only the two known audiences', () => {
    expect(audienceParam('early')).toBe('early')
    expect(audienceParam('couple')).toBe('couple')
    expect(audienceParam('<script>')).toBeNull()
    expect(audienceParam(null)).toBeNull()
  })

  it('splits every stage option into exactly one door', () => {
    const stages = questions.find((q) => q.id === STAGE_QUESTION)!.options!.map((o) => o.value)
    const early = stages.filter((s) => stageFitsAudience(s, 'early'))
    const couple = stages.filter((s) => stageFitsAudience(s, 'couple'))
    expect(early).toEqual(['talking', 'dating'])
    expect([...early, ...couple].sort()).toEqual([...stages].sort())
  })

  it('opens the check with the chosen door', () => {
    expect(checkPath('early')).toBe('/check?for=early')
    expect(checkPath(null)).toBe('/check')
  })
})

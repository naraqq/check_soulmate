import { describe, expect, it } from 'vitest'
import { GUESS_CHOICES, guessCode, guessHints, styleFromGuessCode } from './guessGame'
import { LOVE_STYLES, type LoveStyleId } from './loveStyles'

describe('guess game codes', () => {
  it('round-trips every type, whatever the random part', () => {
    for (const id of Object.keys(LOVE_STYLES) as LoveStyleId[]) {
      for (const r of [0, 0.3, 0.999]) {
        expect(styleFromGuessCode(guessCode(id, () => r))?.id).toBe(id)
      }
    }
  })

  it('does not put the type name in the link', () => {
    const code = guessCode('carer', () => 0.5)
    expect(code).toMatch(/^g[0-9a-z]+$/)
    expect(code).not.toContain('carer')
  })

  it('rejects anything that is not a code', () => {
    expect(styleFromGuessCode('carer')).toBeNull()
    expect(styleFromGuessCode('g<script>')).toBeNull()
    expect(styleFromGuessCode(undefined)).toBeNull()
  })

  it('hints with three different names including the real one, in a varying position', () => {
    const positions = new Set<number>()
    for (let r = 0; r < 1; r += 0.013) {
      const code = guessCode('deep', () => r)
      const hints = guessHints(code)
      expect(hints).toHaveLength(3)
      expect(new Set(hints.map((h) => h.id)).size).toBe(3)
      expect(hints.map((h) => h.id)).toContain('deep')
      positions.add(hints.findIndex((h) => h.id === 'deep'))
    }
    expect(positions).toEqual(new Set([0, 1, 2]))
  })

  it('offers every type as a choice', () => {
    expect(GUESS_CHOICES.map((s) => s.id).sort()).toEqual(Object.keys(LOVE_STYLES).sort())
  })
})

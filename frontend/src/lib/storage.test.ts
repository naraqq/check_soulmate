import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { storage } from './storage'

let data: Map<string, string>
beforeEach(() => {
  data = new Map()
  vi.stubGlobal('window', { localStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  } })
})
afterEach(() => vi.unstubAllGlobals())

describe('repeat check selection', () => {
  it('requires explicit opt-in and clears links for a new relationship', () => {
    expect(storage.loadComparisonToken()).toBeNull()
    storage.saveComparisonToken('a'.repeat(48))
    storage.saveProgress({ questionnaireVersion: 'current', currentIndex: 0, answers: {}, completed: false })
    expect(storage.loadComparisonToken()).toBe('a'.repeat(48))
    storage.clearAll()
    expect(storage.loadComparisonToken()).toBeNull()
    expect(storage.loadProgress('current')).toBeNull()
  })

  it('does not compare when persisted data is corrupted', () => {
    storage.saveComparisonToken('not-a-token')
    expect(storage.loadComparisonToken()).toBeNull()
    data.set('soulmate.comparison.v1', '{invalid')
    expect(storage.loadComparisonToken()).toBeNull()
  })

  it('keeps current answers when comparison is cancelled', () => {
    storage.saveProgress({ questionnaireVersion: 'current', currentIndex: 4, answers: { basics_type: 'dating' }, completed: false })
    storage.saveComparisonToken('a'.repeat(48))
    storage.clearComparisonToken()
    expect(storage.loadProgress('current')?.answers.basics_type).toBe('dating')
  })

  it('works when browser storage is blocked', () => {
    vi.stubGlobal('window', { get localStorage() { throw new Error('blocked') } })
    expect(() => storage.saveComparisonToken('a'.repeat(48))).not.toThrow()
    expect(storage.loadComparisonToken()).toBeNull()
    expect(() => storage.clearAll()).not.toThrow()
  })
})

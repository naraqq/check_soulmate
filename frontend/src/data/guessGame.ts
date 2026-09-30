import { LOVE_STYLES, type LoveStyle, type LoveStyleId } from './loveStyles'

/**
 * "Миний хайрын хэв маягийг тааж чадах уу?" — friends guess someone's love style before
 * seeing it. The result travels in the link itself (/guess/<code>), so nothing is stored
 * on the server and nothing but the type name is ever revealed.
 *
 * The code is lightly scrambled (a random multiple plus the type's position), so the answer
 * isn't sitting in plain sight in the URL. It's a game, not a secret.
 */

/** Never reorder or remove — existing links decode through this list. Only append. */
const ORDER: LoveStyleId[] = ['carer', 'open', 'anchor', 'independent', 'deep', 'seeker']

export function guessCode(id: LoveStyleId, rand: () => number = Math.random): string {
  const n = Math.floor(rand() * 5000) * ORDER.length + ORDER.indexOf(id)
  return `g${n.toString(36)}`
}

function codeNumber(code: string): number | null {
  if (!/^g[0-9a-z]{1,6}$/.test(code)) return null
  const n = parseInt(code.slice(1), 36)
  return Number.isSafeInteger(n) ? n : null
}

export function styleFromGuessCode(code: string | undefined): LoveStyle | null {
  const n = code ? codeNumber(code) : null
  return n === null ? null : LOVE_STYLES[ORDER[n % ORDER.length]]
}

/**
 * Three names for the story teaser: the real one plus two others, in an order derived from
 * the code — the card and the message always agree, and the answer isn't always first.
 */
export function guessHints(code: string): LoveStyle[] {
  const n = codeNumber(code) ?? 0
  const real = ORDER[n % ORDER.length]
  const others = ORDER.filter((id) => id !== real)
  const first = others[n % others.length]
  const second = others[(n * 7 + 3) % others.length] === first ? others[(n + 1) % others.length] : others[(n * 7 + 3) % others.length]
  const picks = [first, second]
  // Position from the random part (n / 6), not n itself — n % 3 would be fixed per type.
  picks.splice(Math.floor(n / ORDER.length) % 3, 0, real)
  return picks.map((id) => LOVE_STYLES[id])
}

/** All types, as the guesser's choices. */
export const GUESS_CHOICES: LoveStyle[] = ORDER.map((id) => LOVE_STYLES[id])

const GUESSED_KEY = (code: string) => `lemony.guess.${code}`

/** Remember a guess on this device, so reopening the link shows the reveal instead of asking again. */
export function saveGuess(code: string, id: LoveStyleId) {
  try {
    window.localStorage.setItem(GUESSED_KEY(code), id)
  } catch {
    // Storage unavailable — they can simply guess again.
  }
}

export function loadGuess(code: string): LoveStyleId | null {
  try {
    const id = window.localStorage.getItem(GUESSED_KEY(code))
    return id && id in LOVE_STYLES ? (id as LoveStyleId) : null
  } catch {
    return null
  }
}

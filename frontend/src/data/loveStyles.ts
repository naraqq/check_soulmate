import type { Answers, Question, Track } from './types'
import { isVisible } from './visibility'

/**
 * "Миний хайрын хэв маяг" — a playful, always-positive label about the person themselves,
 * shared on stories instead of anything about their relationship. It is worked out only
 * from how the user describes their own behaviour and feelings, never the other person.
 * Every type must read as a compliment: nobody should be embarrassed to post theirs.
 */

export type LoveStyleId = 'carer' | 'open' | 'anchor' | 'independent' | 'deep' | 'seeker'

export interface LoveStyle {
  id: LoveStyleId
  name: string
  /** One or two warm sentences in "та" form. */
  description: string
  /** Three short traits for the card. */
  traits: [string, string, string]
  theme: 'violet' | 'rose' | 'lemon'
}

export const LOVE_STYLES: Record<LoveStyleId, LoveStyle> = {
  carer: {
    id: 'carer',
    name: 'Халамжлагч',
    description: 'Та хайраа үйлдлээрээ харуулдаг. Холбоог дулаан байлгахын тулд хамгийн түрүүнд алхдаг хүн нь та.',
    traits: ['Түрүүлж санаа тавьдаг', 'Жижиг зүйлийг анзаардаг', 'Хайраа үйлдлээр харуулдаг'],
    theme: 'rose',
  },
  open: {
    id: 'open',
    name: 'Нээлттэй зүрх',
    description: 'Та сэтгэлээ нуудаггүй. Хүнд сэдвийг ч тайван, үнэнээр нь ярьж чаддаг.',
    traits: ['Мэдрэмжээ шууд хэлдэг', 'Үнэнч, ил тод', 'Сонсож чаддаг'],
    theme: 'violet',
  },
  anchor: {
    id: 'anchor',
    name: 'Тайван бэхлэгч',
    description: 'Та харилцаанд тайван, найдвартай мэдрэмж авчирдаг. Таны дэргэд хүн амардаг.',
    traits: ['Итгэл төрүүлдэг', 'Шуурганд ч тайван', 'Найдвартай түшиг'],
    theme: 'lemon',
  },
  independent: {
    id: 'independent',
    name: 'Бие даасан од',
    description: 'Та өөрийнхөө амьдралыг хадгалж чаддаг. Хайр таны амьдралыг дүүргэдэг биш, гэрэлтүүлдэг.',
    traits: ['Өөрийн гэсэн ертөнцтэй', 'Эрх чөлөөг хүндэтгэдэг', 'Хайраар илүү гэрэлтдэг'],
    theme: 'violet',
  },
  deep: {
    id: 'deep',
    name: 'Гүн мэдрэмжтэн',
    description: 'Та бүх зүйлийг зүрхээрээ мэдэрдэг. Жинхэнэ, ойр дотно холбоо танд хамгийн чухал.',
    traits: ['Гүнзгий хайрладаг', 'Бусдын сэтгэлийг мэдэрдэг', 'Ойр дотно байдлыг эрхэмлэдэг'],
    theme: 'rose',
  },
  seeker: {
    id: 'seeker',
    name: 'Жинхэнэ хайгч',
    description: 'Та тоглоом биш, жинхэнэ зүйл хайдаг. Тодорхой байдал, үнэнч байдлыг эрхэмлэдэг.',
    traits: ['Юу хүсэхээ мэддэг', 'Цагаа үнэлдэг', 'Үнэнч байдлыг эрхэмлэдэг'],
    theme: 'lemon',
  },
}

/** Mean option score (0–1) of the answered, applicable questions carrying any of these tags. */
function tagScore(questions: Question[], answers: Answers, tags: string[]): number | null {
  const scores: number[] = []
  for (const q of questions) {
    if (q.category === 'basics' || !q.analysisTags.some((t) => tags.includes(t)) || !isVisible(q, answers)) continue
    const option = q.options?.find((o) => o.value === answers[q.id])
    if (option?.score !== undefined) scores.push(option.score)
  }
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
}

/** How much the user reports leading ("who usually…" questions): 0 = equal or less, 1 = always them. */
function leadScore(questions: Question[], answers: Answers): number | null {
  const balances: number[] = []
  for (const q of questions) {
    if (!q.analysisTags.includes('initiation') || !isVisible(q, answers)) continue
    const option = q.options?.find((o) => o.value === answers[q.id])
    if (option?.balance !== undefined) balances.push(option.balance)
  }
  if (!balances.length) return null
  return Math.max(0, -balances.reduce((a, b) => a + b, 0) / balances.length)
}

/**
 * Per-flow weights, tuned so every type is common (≈12–24% each over random answer sets —
 * see loveStyles.test.ts). The flows differ: early stage has one "who reaches out" question,
 * couples have five, so the lead score varies far less for couples and needs a bigger weight.
 */
const WEIGHTS: Record<Track, Record<LoveStyleId, number>> = {
  early: { carer: 0.9, open: 0.86, anchor: 0.77, independent: 0.9, deep: 0.88, seeker: 0.8 },
  couple: { carer: 1.8, open: 0.66, anchor: 0.9, independent: 0.88, deep: 0.8, seeker: 0 },
}

/** Pick the type that describes the user most strongly. Ties resolve in LOVE_STYLES order, so it's stable. */
export function loveStyleFor(questions: Question[], answers: Answers, track: Track): LoveStyle {
  const w = WEIGHTS[track]
  const secure = tagScore(questions, answers, ['anxiety', 'security'])
  const scores: Record<LoveStyleId, number> = {
    carer: Math.min(1, (leadScore(questions, answers) ?? 0) * w.carer),
    open: (tagScore(questions, answers, ['emotional_safety', 'authenticity']) ?? 0) * w.open,
    anchor: (secure ?? 0) * w.anchor,
    independent: (tagScore(questions, answers, ['independence', 'identity', 'self_worth']) ?? 0) * w.independent,
    deep: secure === null ? 0 : (1 - secure) * w.deep,
    seeker: answers.intent_you === 'serious' ? w.seeker : 0,
  }
  const best = (Object.keys(LOVE_STYLES) as LoveStyleId[]).reduce((a, b) => (scores[b] > scores[a] ? b : a))
  return LOVE_STYLES[best]
}

const STORAGE_KEY = 'lemony.lovestyle.v1'

/** Remembered on this device so the report page (which has no answers) can offer the same card. */
export function saveLoveStyle(id: LoveStyleId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // Storage unavailable — the report page then offers invites only.
  }
}

export function loadLoveStyle(): LoveStyle | null {
  try {
    const id = window.localStorage.getItem(STORAGE_KEY)
    return id && id in LOVE_STYLES ? LOVE_STYLES[id as LoveStyleId] : null
  } catch {
    return null
  }
}

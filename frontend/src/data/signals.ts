import type { AnswerFlag, ScoredCategoryId } from './types'

/**
 * Titles for the pre-payment teaser. Deliberately short and non-specific:
 * they create curiosity without revealing the explanation.
 */
export const strengthTitles: Record<ScoredCategoryId, string> = {
  communication: 'Нээлттэй харилцан яриа',
  affection: 'Дулаан сэтгэл, энхрийлэл',
  effort: 'Хамтын хүчин чармайлт',
  trust: 'Итгэлцлийн бат суурь',
  conflict: 'Маргааны дараах эвлэрэл',
  independence: 'Өөрийгөө хадгалах чадвар',
  future: 'Нийтлэг чиг хандлага',
}

export const exploreTitles: Record<ScoredCategoryId, string> = {
  communication: 'Бүрэн сонсогдох мэдрэмж',
  affection: 'Өдөр тутмын энхрийлэл',
  effort: 'Хүчин чармайлтын хуваарилалт',
  trust: 'Итгэл ба тайван байдал',
  conflict: 'Маргаан ба эвлэрэл',
  independence: 'Бие даасан байдал ба аюулгүй мэдрэмж',
  future: 'Ирээдүйн хүлээлт',
}

/** Ordered by priority — the first matching flag becomes the "pattern" teaser. */
export const patternTitles: Record<AnswerFlag, string> = {
  harmful_conflict: 'Маргааны үеийн харьцаа',
  trust_breach: 'Өнгөрсөн үйл явдлын дараах итгэл',
  fear_of_reaction: 'Гомдлоо хуваалцахад аюулгүй санагдах эсэх',
  status_quo_unhappy: 'Ирээдүйн замын талаарх таны мэдрэмж',
  effort_imbalance: 'Хүчин чармайлтын тэнцвэр',
  initiation_imbalance: 'Хэн нь түрүүлж холбогддог вэ',
  unresolved_conflict: 'Дахин дахин эргэж ирдэг асуудлууд',
  drifting_apart: 'Ойр дотно байдлын өөрчлөлт',
  fidelity_worry: 'Санаа зовнил ба итгэл',
  emotional_dependence: 'Таны сэтгэл санааны тэнцвэр',
  attention_seeking: 'Анхаарал хүсэх мэдрэмж',
}

export const flagPriority = Object.keys(patternTitles) as AnswerFlag[]

export type SignalId = `strength:${ScoredCategoryId}` | `explore:${ScoredCategoryId}` | `pattern:${AnswerFlag}`

/** Flat id → title map, exported to the backend so it never trusts client-sent titles. */
export function signalCatalog(): Record<SignalId, string> {
  const entries: [SignalId, string][] = [
    ...Object.entries(strengthTitles).map(([k, v]) => [`strength:${k}`, v] as [SignalId, string]),
    ...Object.entries(exploreTitles).map(([k, v]) => [`explore:${k}`, v] as [SignalId, string]),
    ...Object.entries(patternTitles).map(([k, v]) => [`pattern:${k}`, v] as [SignalId, string]),
  ]
  return Object.fromEntries(entries) as Record<SignalId, string>
}

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
  interest: 'Хоёр талын сонирхол',
  consistency: 'Тогтвортой, найдвартай байдал',
  connection: 'Жинхэнэ холбоо',
  intentions: 'Ижил зүйл хайж буй байдал',
  respect: 'Хүндэтгэл ба аюулгүй мэдрэмж',
  values: 'Амьдралын нийцэл',
  feelings: 'Таны дотоод тайван байдал',
}

export const exploreTitles: Record<ScoredCategoryId, string> = {
  communication: 'Бүрэн сонсогдох мэдрэмж',
  affection: 'Өдөр тутмын энхрийлэл',
  effort: 'Хүчин чармайлтын хуваарилалт',
  trust: 'Итгэл ба тайван байдал',
  conflict: 'Маргаан ба эвлэрэл',
  independence: 'Бие даасан байдал ба аюулгүй мэдрэмж',
  future: 'Ирээдүйн хүлээлт',
  interest: 'Сонирхлын тэнцвэр',
  consistency: 'Үг ба үйлдлийн нийцэл',
  connection: 'Холбооны гүн',
  intentions: 'Та хоёр юу хайж байна вэ',
  respect: 'Хил хязгаар ба хүндэтгэл',
  values: 'Үнэт зүйлсийн нийцэл',
  feelings: 'Энэ харилцаа танд ямар санагддаг вэ',
}

/** Ordered by priority — the first matching flag becomes the "pattern" teaser. */
export const patternTitles: Record<AnswerFlag, string> = {
  harmful_conflict: 'Маргааны үеийн харьцаа',
  boundary_pressure: 'Таны хил хязгаарыг хүндэтгэх байдал',
  early_control: 'Эрх чөлөө ба хяналт',
  trust_breach: 'Өнгөрсөн үйл явдлын дараах итгэл',
  fear_of_reaction: 'Гомдлоо хуваалцахад аюулгүй санагдах эсэх',
  intentions_mismatch: 'Та хоёрын хүсэж буй зүйлийн зөрүү',
  mixed_signals: 'Холимог дохионууд',
  disappearing: 'Гэнэт алга болох хэв маяг',
  unclear_intentions: 'Тодорхойгүй зорилго',
  status_quo_unhappy: 'Ирээдүйн замын талаарх таны мэдрэмж',
  effort_imbalance: 'Хүчин чармайлтын тэнцвэр',
  initiation_imbalance: 'Хэн нь түрүүлж холбогддог вэ',
  unresolved_conflict: 'Дахин дахин эргэж ирдэг асуудлууд',
  drifting_apart: 'Ойр дотно байдлын өөрчлөлт',
  fidelity_worry: 'Санаа зовнил ба итгэл',
  emotional_dependence: 'Таны сэтгэл санааны тэнцвэр',
  attention_seeking: 'Анхаарал хүсэх мэдрэмж',
  fading_interest: 'Сонирхлын өөрчлөлт',
  concerning_habits: 'Санаа зовоох зуршлууд',
  values_mismatch: 'Амьдралын үнэт зүйлсийн ялгаа',
  others_concerned: 'Ойр дотны хүмүүсийн санаа зовнил',
  self_silencing: 'Өөрөөрөө байх эрх чөлөө',
  feeling_drained: 'Энэ харилцааны таны сэтгэлд үзүүлэх нөлөө',
  overthinking: 'Хүлээлт ба түгшүүр',
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

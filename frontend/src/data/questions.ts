import type { AnswerFlag, AnswerOption, Category, Question } from './types'

/**
 * The questionnaire. Edit wording, options, scores and order here — no
 * component changes needed. After editing run `npm run export:questions` so
 * the Laravel backend (which validates answers and builds the AI prompt from
 * this data) receives the same copy.
 *
 * Option `value`s are stable identifiers — change labels freely, but bump
 * QUESTIONNAIRE_VERSION whenever question ids or option values change.
 */
export const QUESTIONNAIRE_VERSION = '2026.09.1'

export const categories: Category[] = [
  { id: 'basics', label: 'Харилцааны үндэс', description: 'Та хоёрын талаар бага зэрэг мэдээлэл.' },
  { id: 'communication', label: 'Харилцан яриа', description: 'Хэрхэн ярилцаж, сонсож, холбогддог вэ.' },
  { id: 'affection', label: 'Энхрийлэл', description: 'Дулаан сэтгэл, ойр дотно байдал, хүсэгдэх мэдрэмж.' },
  { id: 'effort', label: 'Хичээл зүтгэл', description: 'Хэн санаачилж, төлөвлөж, асуудлыг засдаг вэ.' },
  { id: 'trust', label: 'Итгэлцэл', description: 'Аюулгүй мэдрэмж, санаа зовнил, итгэл.' },
  { id: 'conflict', label: 'Маргаан', description: 'Санал зөрөлдөөн хэрхэн өрнөж, шийдэгддэг вэ.' },
  { id: 'independence', label: 'Бие даасан байдал', description: 'Харилцаан доторх таны өөрийн амьдрал.' },
  { id: 'future', label: 'Ирээдүй', description: 'Та хоёр энэ харилцааг хаашаа чиглэж байна гэж хардаг вэ.' },
]

// ---------------------------------------------------------------------------
// Option helpers — keep scoring consistent across similar questions.
// ---------------------------------------------------------------------------

const FREQUENCY = ['Хэзээ ч үгүй', 'Ховор', 'Заримдаа', 'Ихэвчлэн', 'Бараг үргэлж'] as const
const FREQUENCY_VALUES = ['never', 'rarely', 'sometimes', 'often', 'almost_always'] as const
const POSITIVE_SCORES = [0, 0.25, 0.5, 0.8, 1]
const NEGATIVE_SCORES = [1, 0.8, 0.5, 0.2, 0]

/** Frequency scale where "Бараг үргэлж" is the supportive end. */
function positiveFrequency(flagLow?: AnswerFlag): AnswerOption[] {
  return FREQUENCY.map((label, i) => ({
    value: FREQUENCY_VALUES[i],
    label,
    score: POSITIVE_SCORES[i],
    ...(flagLow && i <= 1 ? { flag: flagLow } : {}),
  }))
}

/** Frequency scale where "Хэзээ ч үгүй" is the supportive end. */
function negativeFrequency(flagHigh?: AnswerFlag): AnswerOption[] {
  return FREQUENCY.map((label, i) => ({
    value: FREQUENCY_VALUES[i],
    label,
    score: NEGATIVE_SCORES[i],
    ...(flagHigh && i >= 3 ? { flag: flagHigh } : {}),
  }))
}

/** "Ихэвчлэн хэн…?" — balance questions. Equal effort scores highest. */
function whoUsually(flagMostlyMe?: AnswerFlag): AnswerOption[] {
  return [
    { value: 'mostly_me', label: 'Ихэвчлэн би', balance: -1, score: 0.4, ...(flagMostlyMe ? { flag: flagMostlyMe } : {}) },
    { value: 'slightly_me', label: 'Арай илүү би', balance: -0.5, score: 0.8 },
    { value: 'equal', label: 'Ойролцоогоор адилхан', balance: 0, score: 1 },
    { value: 'slightly_partner', label: 'Арай илүү хамтрагч маань', balance: 0.5, score: 0.8 },
    { value: 'mostly_partner', label: 'Ихэвчлэн хамтрагч маань', balance: 1, score: 0.5 },
  ]
}

function yesNo(yesScore: number, noScore: number, flag?: { on: 'yes' | 'no'; flag: AnswerFlag }): AnswerOption[] {
  return [
    { value: 'yes', label: 'Тийм', score: yesScore, ...(flag?.on === 'yes' ? { flag: flag.flag } : {}) },
    { value: 'no', label: 'Үгүй', score: noScore, ...(flag?.on === 'no' ? { flag: flag.flag } : {}) },
  ]
}

// ---------------------------------------------------------------------------
// Questions — shown in array order.
// ---------------------------------------------------------------------------

export const questions: Question[] = [
  // ХАРИЛЦААНЫ ҮНДЭС ----------------------------------------------------------
  {
    id: 'basics_duration',
    category: 'basics',
    text: 'Та хоёр хэр удаан хамт байгаа вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'stage'],
    options: [
      { value: 'lt_1m', label: '1 сараас бага' },
      { value: '1_3m', label: '1–3 сар' },
      { value: '3_6m', label: '3–6 сар' },
      { value: '6_12m', label: '6–12 сар' },
      { value: '1_3y', label: '1–3 жил' },
      { value: '3y_plus', label: '3-аас дээш жил' },
    ],
  },
  {
    id: 'basics_type',
    category: 'basics',
    text: 'Та хоёрын харилцааг юу хамгийн сайн тодорхойлох вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'stage'],
    options: [
      { value: 'talking', label: 'Ярилцаж, танилцаж байгаа' },
      { value: 'dating', label: 'Болзож байгаа' },
      { value: 'exclusive', label: 'Зөвхөн бие биетэйгээ үерхэж байгаа' },
      { value: 'living_together', label: 'Хамт амьдарч байгаа' },
      { value: 'engaged', label: 'Сүй тавьсан' },
      { value: 'married', label: 'Гэрлэсэн' },
    ],
  },
  {
    id: 'basics_frequency',
    category: 'basics',
    text: 'Та хоёр хэр олон уулздаг вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'time_together'],
    options: [
      { value: 'daily', label: 'Бараг өдөр бүр' },
      { value: 'several_week', label: 'Долоо хоногт хэд хэдэн удаа' },
      { value: 'weekly', label: 'Долоо хоногт нэг орчим удаа' },
      { value: 'occasionally', label: 'Хааяа' },
      { value: 'long_distance', label: 'Хол зайнаас харилцдаг' },
    ],
  },

  // ХАРИЛЦАН ЯРИА ------------------------------------------------------------
  {
    id: 'comm_initiates',
    category: 'communication',
    text: 'Ихэвчлэн хэн нь яриа эхлүүлдэг вэ?',
    type: 'single_choice',
    analysisTags: ['communication', 'initiation', 'balance'],
    options: whoUsually('initiation_imbalance'),
  },
  {
    id: 'comm_if_not_first',
    category: 'communication',
    text: 'Хэрвээ та түрүүлж бичихгүй бол ихэвчлэн юу болдог вэ?',
    type: 'single_choice',
    analysisTags: ['communication', 'initiation', 'reciprocity'],
    options: [
      { value: 'quickly', label: 'Тэр удалгүй өөрөө холбогддог', score: 1 },
      { value: 'eventually', label: 'Эцэст нь тэр холбогддог', score: 0.7 },
      { value: 'long_time', label: 'Нэлээд удаан хугацаа өнгөрч магадгүй', score: 0.3, flag: 'initiation_imbalance' },
      { value: 'no_contact', label: 'Бид огт ярихгүй байж ч магадгүй', score: 0, flag: 'initiation_imbalance' },
    ],
  },
  {
    id: 'comm_heard',
    category: 'communication',
    text: 'Чухал зүйлийн талаар ярихад таныг сонсож байна гэж мэдрэгддэг үү?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['communication', 'emotional_support'],
    options: positiveFrequency(),
  },
  {
    id: 'comm_interest',
    category: 'communication',
    text: 'Хамтрагч тань таны бодол, мэдрэмжийг үнэхээр сонирхдог юм шиг санагддаг уу?',
    type: 'scale',
    analysisTags: ['communication', 'emotional_support', 'curiosity'],
    options: positiveFrequency(),
  },
  {
    id: 'comm_share_hurt',
    category: 'communication',
    text: 'Ямар нэг зүйл таныг гомдоосон үед та хамтрагчийнхаа хариу үйлдлээс айхгүйгээр хэлж чаддаг уу?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['communication', 'emotional_safety'],
    options: positiveFrequency('fear_of_reaction'),
  },
  {
    id: 'comm_calm',
    category: 'communication',
    text: 'Санал зөрөлдөөнөө ихэвчлэн тайван ярилцаж чаддаг уу?',
    type: 'scale',
    analysisTags: ['communication', 'conflict_style'],
    options: positiveFrequency(),
  },
  {
    id: 'comm_begging',
    category: 'communication',
    text: 'Та анхаарал гуйж байгаа юм шиг мэдрэмж төрдөг үү?',
    type: 'scale',
    analysisTags: ['communication', 'reciprocity', 'attention'],
    options: negativeFrequency('attention_seeking'),
  },
  {
    id: 'comm_avoiding',
    category: 'communication',
    text: 'Хамтрагчтайгаа ярихаас зайлсхийж байгаа чухал зүйл танд бий юу?',
    type: 'yes_no',
    analysisTags: ['communication', 'avoidance'],
    options: yesNo(0.3, 1),
  },

  // ЭНХРИЙЛЭЛ ----------------------------------------------------------------
  {
    id: 'aff_initiates',
    category: 'affection',
    text: 'Ихэвчлэн хэн нь энхрийлэл, дотно байдлыг санаачилдаг вэ?',
    type: 'single_choice',
    analysisTags: ['affection', 'initiation', 'balance'],
    options: whoUsually(),
  },
  {
    id: 'aff_wanted',
    category: 'affection',
    text: 'Та хамтрагчдаа хүсэгдэж байна гэж мэдэрдэг үү?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['affection', 'desire', 'security'],
    options: positiveFrequency(),
  },
  {
    id: 'aff_unprompted',
    category: 'affection',
    text: 'Хамтрагч тань таныг гуйгаагүй байхад хайр, энхрийллээ хэр олон илэрхийлдэг вэ?',
    type: 'scale',
    analysisTags: ['affection', 'reciprocity'],
    options: positiveFrequency(),
  },
  {
    id: 'aff_closeness',
    category: 'affection',
    text: 'Харилцааныхаа эхэн үетэй харьцуулахад та хоёр:',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['affection', 'trajectory'],
    options: [
      { value: 'much_closer', label: 'Хамаагүй ойр болсон', score: 1 },
      { value: 'little_closer', label: 'Арай ойр болсон', score: 0.85 },
      { value: 'same', label: 'Бараг хэвээрээ', score: 0.65 },
      { value: 'little_distant', label: 'Арай хөндийрсөн', score: 0.3, flag: 'drifting_apart' },
      { value: 'much_distant', label: 'Нэлээд хөндийрсөн', score: 0, flag: 'drifting_apart' },
    ],
  },
  {
    id: 'aff_share_news',
    category: 'affection',
    text: 'Сэтгэл хөдөлгөм зүйл тохиоход хамтрагч тань таны хамгийн түрүүнд хэлэхийг хүсдэг хүмүүсийн нэг байдаг уу?',
    type: 'single_choice',
    analysisTags: ['affection', 'friendship'],
    options: [
      { value: 'always', label: 'Тийм, үргэлж', score: 1 },
      { value: 'usually', label: 'Ихэвчлэн', score: 0.75 },
      { value: 'sometimes', label: 'Заримдаа', score: 0.5 },
      { value: 'rarely', label: 'Ховор', score: 0.2 },
      { value: 'not_really', label: 'Тийм ч биш', score: 0 },
    ],
  },
  {
    id: 'aff_quiet_time',
    category: 'affection',
    text: 'Онцгой зүйл хийхгүй байсан ч хамтдаа цагийг өнгөрөөх танд таатай байдаг уу?',
    type: 'scale',
    analysisTags: ['affection', 'friendship', 'quality_time'],
    options: positiveFrequency(),
  },

  // ХИЧЭЭЛ ЗҮТГЭЛ ------------------------------------------------------------
  {
    id: 'effort_plans',
    category: 'effort',
    text: 'Ихэвчлэн хэн нь болзоо, хамтдаа хийх зүйлсийг төлөвлөдөг вэ?',
    type: 'single_choice',
    analysisTags: ['effort', 'initiation', 'balance'],
    options: whoUsually(),
  },
  {
    id: 'effort_resolves',
    category: 'effort',
    text: 'Харилцаанд үүссэн асуудлыг ихэвчлэн хэн нь шийдэхийг хичээдэг вэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['effort', 'repair', 'balance'],
    options: whoUsually('effort_imbalance'),
  },
  {
    id: 'effort_more',
    category: 'effort',
    text: 'Та харилцаандаа хүлээн авч байгаагаасаа илүү хүч чармайлт гаргаж байна гэж санагддаг уу?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['effort', 'reciprocity', 'balance'],
    options: [
      { value: 'balanced', label: 'Үгүй, тэнцвэртэй санагддаг', score: 1, balance: 0 },
      { value: 'partner_more', label: 'Харин ч хамтрагч маань илүү хичээдэг', score: 0.7, balance: 1 },
      { value: 'sometimes', label: 'Заримдаа', score: 0.6, balance: -0.5 },
      { value: 'often', label: 'Ихэвчлэн', score: 0.25, balance: -1, flag: 'effort_imbalance' },
      { value: 'almost_always', label: 'Бараг үргэлж', score: 0, balance: -1, flag: 'effort_imbalance' },
    ],
  },
  {
    id: 'effort_one_week',
    category: 'effort',
    text: 'Хэрвээ та нэг долоо хоног хичээхээ багасгавал юу болно гэж бодож байна?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['effort', 'reciprocity', 'security'],
    options: [
      { value: 'nothing', label: 'Бараг юу ч өөрчлөгдөхгүй', score: 0.8 },
      { value: 'partner_steps_up', label: 'Хамтрагч маань анзаарч, өөрөө хичээнэ', score: 1 },
      { value: 'distant', label: 'Бид мэдэгдэхүйц хөндийрнө', score: 0.3, flag: 'effort_imbalance' },
      { value: 'fall_apart', label: 'Харилцаа маань нурчих вий гэж айдаг', score: 0, flag: 'effort_imbalance' },
    ],
  },

  // ИТГЭЛЦЭЛ -----------------------------------------------------------------
  {
    id: 'trust_level',
    category: 'trust',
    text: 'Та хамтрагчдаа хэр их итгэдэг вэ?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['trust'],
    options: [
      { value: 'completely', label: 'Бүрэн итгэдэг', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ итгэдэг', score: 0.75 },
      { value: 'somewhat', label: 'Зарим талаар', score: 0.45 },
      { value: 'a_little', label: 'Бага зэрэг', score: 0.2 },
      { value: 'not_at_all', label: 'Огт итгэдэггүй', score: 0 },
    ],
  },
  {
    id: 'trust_lose_interest',
    category: 'trust',
    text: 'Хамтрагч тань танд сонирхолгүй болчих вий гэж та байнга санаа зовдог уу?',
    type: 'scale',
    analysisTags: ['trust', 'security', 'anxiety'],
    options: negativeFrequency(),
  },
  {
    id: 'trust_someone_else',
    category: 'trust',
    text: 'Хамтрагч тань өөр хүнийг сонирхчих вий гэж та санаа зовдог уу?',
    type: 'scale',
    analysisTags: ['trust', 'fidelity', 'anxiety'],
    options: negativeFrequency('fidelity_worry'),
  },
  {
    id: 'trust_reasons',
    category: 'trust',
    text: 'Хамтрагч тань танд өөрт нь итгэхгүй байх бодит шалтгаан өгч байсан уу?',
    helper: 'Ерөнхий санаа зовнил биш, бодит тохиолдлуудыг бодоорой.',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['trust', 'fidelity', 'history'],
    options: [
      { value: 'no', label: 'Үгүй', score: 1 },
      { value: 'small_things', label: 'Хэдэн жижиг зүйл', score: 0.6 },
      { value: 'significant', label: 'Тийм, ноцтой зүйл', score: 0.15, flag: 'trust_breach' },
      { value: 'multiple', label: 'Олон удаа', score: 0, flag: 'trust_breach' },
    ],
  },
  {
    id: 'trust_time_apart',
    category: 'trust',
    text: 'Хамтрагч тань тантай хамт биш цагийг өнгөрөөхөд та хэр тайван байдаг вэ?',
    type: 'single_choice',
    analysisTags: ['trust', 'security', 'independence'],
    options: [
      { value: 'very', label: 'Маш тайван', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ тайван', score: 0.75 },
      { value: 'uneasy', label: 'Жаахан тавгүй', score: 0.45 },
      { value: 'uncomfortable', label: 'Нэлээд тавгүй', score: 0.2 },
      { value: 'very_uncomfortable', label: 'Маш тавгүй', score: 0 },
    ],
  },

  // МАРГААН ------------------------------------------------------------------
  {
    id: 'conflict_frequency',
    category: 'conflict',
    text: 'Ноцтой маргаан хэр олон гардаг вэ?',
    type: 'single_choice',
    analysisTags: ['conflict', 'frequency'],
    options: [
      { value: 'rarely', label: 'Ховор эсвэл огт гардаггүй', score: 1 },
      { value: 'few_year', label: 'Жилд хэдхэн удаа', score: 0.8 },
      { value: 'monthly', label: 'Сард нэг орчим', score: 0.55 },
      { value: 'weekly', label: 'Долоо хоногт нэг орчим', score: 0.25 },
      { value: 'several_week', label: 'Долоо хоногт хэд хэдэн удаа', score: 0 },
    ],
  },
  {
    id: 'conflict_harm',
    category: 'conflict',
    text: 'Маргааны үеэр та хоёрын хэн нэг нь нөгөөгөө доромжлох, шоолох, сүрдүүлэх эсвэл санаатайгаар гутаах явдал гардаг уу?',
    type: 'single_choice',
    weight: 2,
    analysisTags: ['conflict', 'respect', 'safety'],
    options: [
      { value: 'never', label: 'Үгүй, хэзээ ч', score: 1 },
      { value: 'once_or_twice', label: 'Нэг хоёр удаа тохиолдсон', score: 0.4, flag: 'harmful_conflict' },
      { value: 'sometimes', label: 'Тийм, заримдаа', score: 0.1, flag: 'harmful_conflict' },
      { value: 'often', label: 'Тийм, байнга', score: 0, flag: 'harmful_conflict' },
    ],
  },
  {
    id: 'conflict_after',
    category: 'conflict',
    text: 'Маргааны дараа ихэвчлэн юу болдог вэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['conflict', 'repair'],
    options: [
      { value: 'resolve', label: 'Бид ярилцаж, шийддэг', score: 1 },
      { value: 'apologize', label: 'Бидний нэг нь уучлалт гуйдаг', score: 0.7 },
      { value: 'ignore', label: 'Юу ч болоогүй юм шиг байдаг', score: 0.35 },
      { value: 'gives_in', label: 'Нэг нь бууж өгдөг', score: 0.3 },
      { value: 'stop_talking', label: 'Хэсэг хугацаанд ярихаа больдог', score: 0.2 },
      { value: 'unresolved', label: 'Хэзээ ч бүрэн шийдэгддэггүй', score: 0, flag: 'unresolved_conflict' },
    ],
  },
  {
    id: 'conflict_recurring',
    category: 'conflict',
    text: 'Ижил асуудлууд дахин дахин давтагддаг уу?',
    type: 'scale',
    analysisTags: ['conflict', 'repair', 'patterns'],
    options: negativeFrequency('unresolved_conflict'),
  },
  {
    id: 'conflict_reach_out',
    category: 'conflict',
    text: 'Маргааны дараа ихэвчлэн хэн нь түрүүлж эвлэрэхийг оролддог вэ?',
    type: 'single_choice',
    analysisTags: ['conflict', 'repair', 'balance'],
    options: whoUsually(),
  },

  // БИЕ ДААСАН БАЙДАЛ ---------------------------------------------------------
  {
    id: 'indep_own_life',
    category: 'independence',
    text: 'Та өөрийн хобби, найз нөхөд, зорилгоо хадгалж чаддаг уу?',
    type: 'single_choice',
    analysisTags: ['independence', 'identity'],
    options: [
      { value: 'fully', label: 'Тийм, бүрэн', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ', score: 0.75 },
      { value: 'somewhat', label: 'Зарим талаар', score: 0.45 },
      { value: 'not_really', label: 'Тийм ч биш', score: 0.15 },
      { value: 'lost', label: 'Ихэнхийг нь алдсан', score: 0 },
    ],
  },
  {
    id: 'indep_anxiety',
    category: 'independence',
    text: 'Хамтрагч тань хэдэн цагийн турш хариу өгөхгүй бол та хэр их түгшдэг вэ?',
    type: 'single_choice',
    analysisTags: ['independence', 'anxiety', 'security'],
    options: [
      { value: 'not_at_all', label: 'Огт түгшдэггүй', score: 1 },
      { value: 'slightly', label: 'Бага зэрэг', score: 0.75 },
      { value: 'moderately', label: 'Дунд зэрэг', score: 0.45 },
      { value: 'very', label: 'Маш их', score: 0.2, flag: 'emotional_dependence' },
      { value: 'extremely', label: 'Туйлын их', score: 0, flag: 'emotional_dependence' },
    ],
  },
  {
    id: 'indep_mood',
    category: 'independence',
    text: 'Таны сэтгэл санаа тухайн өдөр хамтрагч тань тантай хэрхэн харьцсанаас их хамаардаг уу?',
    type: 'scale',
    analysisTags: ['independence', 'emotional_regulation'],
    options: negativeFrequency('emotional_dependence'),
  },
  {
    id: 'indep_day_apart',
    category: 'independence',
    text: 'Хамтрагчтайгаа огт холбогдохгүйгээр бүтэн өдрийг тайван, таатай өнгөрөөж чадах уу?',
    type: 'single_choice',
    analysisTags: ['independence', 'security'],
    options: [
      { value: 'easily', label: 'Амархан', score: 1 },
      { value: 'probably', label: 'Чадах байх', score: 0.75 },
      { value: 'with_effort', label: 'Жаахан хичээвэл чадна', score: 0.45 },
      { value: 'hard', label: 'Хэцүү байх болно', score: 0.2 },
      { value: 'no', label: 'Үгүй', score: 0 },
    ],
  },

  // ИРЭЭДҮЙ ------------------------------------------------------------------
  {
    id: 'future_discussed',
    category: 'future',
    text: 'Та хоёр энэ харилцаанаас юу хүсэж байгаагаа ярилцаж байсан уу?',
    type: 'single_choice',
    analysisTags: ['future', 'communication'],
    options: [
      { value: 'clearly', label: 'Тийм, нээлттэй, тодорхой', score: 1 },
      { value: 'somewhat', label: 'Тодорхой хэмжээгээр', score: 0.6 },
      { value: 'briefly', label: 'Зөвхөн товчхон', score: 0.35 },
      { value: 'not_yet', label: 'Одоохондоо үгүй', score: 0.3 },
      { value: 'avoid', label: 'Бид энэ сэдвээс зайлсхийдэг', score: 0 },
    ],
  },
  {
    id: 'future_align',
    category: 'future',
    text: 'Та хоёрын ирээдүйн хүлээлт нийцдэг гэж та бодож байна уу?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['future', 'alignment'],
    options: [
      { value: 'completely', label: 'Бүрэн нийцдэг', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ нийцдэг', score: 0.75 },
      { value: 'unsure', label: 'Сайн мэдэхгүй байна', score: 0.4 },
      { value: 'somewhat_different', label: 'Зарим талаар ялгаатай юм шиг', score: 0.25 },
      { value: 'very_different', label: 'Их ялгаатай юм шиг', score: 0 },
    ],
  },
  {
    id: 'future_build',
    category: 'future',
    text: 'Та энэ хүнтэй хамт амьдралаа цогцлоохыг төсөөлж чадах уу?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['future', 'commitment'],
    options: [
      { value: 'definitely', label: 'Мэдээж', score: 1 },
      { value: 'probably', label: 'Магадгүй', score: 0.75 },
      { value: 'not_sure', label: 'Сайн мэдэхгүй', score: 0.4 },
      { value: 'probably_not', label: 'Магадгүй үгүй', score: 0.15 },
      { value: 'no', label: 'Үгүй', score: 0 },
    ],
  },
  {
    id: 'future_included',
    category: 'future',
    text: 'Хамтрагч тань таныг ирээдүйнхээ нэг хэсэг гэж хардаг гэж та мэдэрдэг үү?',
    type: 'single_choice',
    analysisTags: ['future', 'security', 'commitment'],
    options: [
      { value: 'clearly', label: 'Тийм, тодорхой', score: 1 },
      { value: 'think_so', label: 'Тийм гэж бодож байна', score: 0.7 },
      { value: 'not_sure', label: 'Сайн мэдэхгүй', score: 0.35 },
      { value: 'dont_think', label: 'Тийм гэж бодохгүй байна', score: 0.1 },
      { value: 'no', label: 'Үгүй', score: 0 },
    ],
  },
  {
    id: 'future_three_years',
    category: 'future',
    text: 'Хэрвээ ирэх 3 жилийн турш та хоёрын харилцаанд юу ч өөрчлөгдөхгүй бол та ямар мэдрэмж төрөх вэ?',
    type: 'single_choice',
    weight: 2,
    analysisTags: ['future', 'satisfaction', 'overall'],
    options: [
      { value: 'very_happy', label: 'Маш баяртай байна', score: 1 },
      { value: 'mostly_happy', label: 'Ихэнхдээ баяртай байна', score: 0.75 },
      { value: 'unsure', label: 'Эргэлзэж байна', score: 0.4 },
      { value: 'unhappy', label: 'Баярлахгүй', score: 0.15, flag: 'status_quo_unhappy' },
      { value: 'would_not_want', label: 'Би ийм байхыг хүсэхгүй', score: 0, flag: 'status_quo_unhappy' },
    ],
  },
  {
    id: 'final_wish',
    category: 'future',
    text: 'Хамтрагч тань таны мэдрэмжийн талаар ойлгоосой гэж хүсдэг ганц зүйл юу вэ?',
    helper: 'Заавал биш. Нэр болон таныг таних боломжтой мэдээлэл бичихгүй байхыг хүсье.',
    type: 'text',
    optional: true,
    placeholder: 'Хүссэн хэмжээгээрээ бичээрэй…',
    maxLength: 1000,
    analysisTags: ['open_reflection'],
  },
]

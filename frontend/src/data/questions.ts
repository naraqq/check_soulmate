import { SHOW_FOR } from './track'
import type { AnswerFlag, AnswerOption, Category, Question, ShowIf, Track } from './types'

/**
 * The questionnaire. Edit wording, options, scores and order here — no
 * component changes needed. After editing run `npm run export:questions` so
 * the Laravel backend (which validates answers and builds the AI prompt from
 * this data) receives the same copy.
 *
 * Option `value`s are stable identifiers — change labels freely, but bump
 * QUESTIONNAIRE_VERSION whenever question ids or option values change.
 */
export const QUESTIONNAIRE_VERSION = '2026.10.5'

export const categories: Category[] = [
  {
    id: 'basics',
    label: 'Та хоёрын тухай',
    description: 'Харилцааны тань шат болон сүүлийн үеийн тухай.',
    intro: {
      title: 'Эхлээд та хоёрын тухай',
      text: 'Зөв, буруу хариулт гэж байхгүй. Сүүлийн 2–4 долоо хоногт ямар байснаа бодоорой. Дөнгөж танилцсан бол танилцсанаас хойших хугацаагаа бодоорой.',
    },
    // Context only, not scored — the same gentle line whatever the answers.
  },
  {
    id: 'self',
    label: 'Та өөрөө',
    description: 'Та хайраа хэрхэн илэрхийлж, юу хэрэгтэй байдаг вэ.',
    intro: {
      title: 'Таны хэрэгцээ ба хайрлах хэв маяг',
      text: 'Та хайраа хэрхэн илэрхийлж, юу хэрэгтэй байдаг тухай хэдэн асуулт. Тайлан тань үүгээр илүү хувийн болно.',
    },
    // About the person, not scored — the same line whatever the answers.
  },
  {
    id: 'communication',
    label: 'Харилцан яриа',
    description: 'Хэрхэн ярилцаж, сонсож, холбогддог вэ.',
    intro: {
      title: 'Одоо та хоёрын харилцан ярианы тухай',
      text: 'Хэрхэн ярилцдаг, бие биедээ сэтгэлээ хэлж чаддаг эсэхийг асууя.',
    },
  },
  {
    id: 'affection',
    label: 'Энхрийлэл',
    description: 'Дулаан сэтгэл, ойр дотно байдал, хүсэгдэх мэдрэмж.',
    intro: {
      title: 'Энхрийлэл ба ойр дотно байдал',
      text: 'Халамжаа яаж илэрхийлдэг, хамт байхдаа танд ямар санагддаг тухай асууя.',
    },
  },
  {
    id: 'effort',
    label: 'Хичээл зүтгэл',
    description: 'Хэн санаачилж, төлөвлөж, асуудлыг засдаг вэ.',
    intro: {
      title: 'Хэн хэр их хичээдэг вэ?',
      text: 'Хэн нь санаачилдаг, асуудал гарахад хэрхэн хамт шийддэг тухай асууя.',
    },
  },
  {
    id: 'trust',
    label: 'Итгэлцэл',
    description: 'Аюулгүй мэдрэмж, санаа зовнил, итгэл.',
    intro: {
      title: 'Итгэлцэл',
      text: 'Хамтрагчдаа хэр итгэдэг, санаа зовдог зүйл бий эсэхийг асууя.',
    },
  },
  {
    id: 'conflict',
    label: 'Маргаан',
    description: 'Санал зөрөлдөөн хэрхэн өрнөж, шийдэгддэг вэ.',
    intro: {
      title: 'Маргаан ба эвлэрэл',
      text: 'Санал зөрөх үедээ яаж харьцдаг, дараа нь хэрхэн ойлголцдог тухай асууя.',
    },
  },
  {
    id: 'independence',
    label: 'Бие даасан байдал',
    description: 'Харилцаан доторх таны өөрийн амьдрал.',
    intro: {
      title: 'Таны орон зай ба бие даасан байдал',
      text: 'Харилцаанаас гадуурх таны амьдрал, найз нөхөд, сэтгэл санааны тэнцвэрийн тухай хэдэн асуулт.',
    },
  },
  {
    id: 'future',
    label: 'Ирээдүй',
    description: 'Та хоёр энэ харилцааг хаашаа чиглэж байна гэж хардаг вэ.',
    intro: {
      title: 'Сүүлийн хэсэг: ирээдүй',
      text: 'Бараг дууслаа. Та хоёр ирээдүйгээ хэрхэн төсөөлдөг тухай асууя.',
    },
  },

  // Early stage (talking / dating) ------------------------------------------
  {
    id: 'interest',
    label: 'Харилцан сонирхол',
    description: 'Та хоёр бие биеэ хэр сонирхож, хэр хичээж байна вэ.',
    intro: {
      title: 'Та хоёр бие биеэ хэр сонирхож байна вэ?',
      text: 'Хэн нь түрүүлж бичдэг, бие биеэ хэр сонирхдог тухай асууя.',
    },
  },
  {
    id: 'consistency',
    label: 'Тогтвортой байдал',
    description: 'Тэр хэлсэндээ хүрдэг үү, тогтвортой байдаг уу.',
    intro: {
      title: 'Үг ба үйлдэл',
      text: 'Хэлсэндээ хүрдэг эсэх, харьцаа нь өөрчлөгддөг эсэхийг асууя.',
    },
  },
  {
    id: 'connection',
    label: 'Холбоо',
    description: 'Та хоёрын хооронд юу мэдрэгддэг вэ.',
    intro: {
      title: 'Та хоёрын хооронд юу мэдрэгддэг вэ?',
      text: 'Яриа нийлдэг эсэх, түүний дэргэд өөрөөрөө байж чаддаг эсэхийг асууя.',
    },
  },
  {
    id: 'intentions',
    label: 'Зорилго',
    description: 'Та хоёр юу хайж байна вэ.',
    intro: {
      title: 'Та хоёр ямар харилцаа хүсэж байна вэ?',
      text: 'Та өөрөө юу хүсэж байгаа, тэр юу хүсэж байгаагаа хэлсэн эсэхийг асууя.',
    },
  },
  {
    id: 'respect',
    label: 'Хүндэтгэл',
    description: 'Тэр таныг болон таны хил хязгаарыг хүндэтгэдэг үү.',
    intro: {
      title: 'Хүндэтгэл ба аюулгүй мэдрэмж',
      text: 'Тэр таны хүсэл, шийдвэрийг хэр хүндэтгэдэг тухай асууя.',
    },
  },
  {
    id: 'values',
    label: 'Нийцэл',
    description: 'Амьдралын хэв маяг, үнэт зүйлс, ирээдүйн төлөвлөгөө.',
    intro: {
      title: 'Та хоёр хэр нийцдэг вэ?',
      text: 'Та хоёрын амьдралын хэв маяг, хүсэл төлөвлөгөө хэр нийцдэгийг асууя.',
    },
  },
  {
    id: 'feelings',
    label: 'Таны мэдрэмж',
    description: 'Энэ харилцаа танд ямар мэдрэмж төрүүлдэг вэ.',
    intro: {
      title: 'Энэ харилцаа танд ямар санагддаг вэ?',
      text: 'Бараг дууслаа. Энэ хүнтэй харилцахад танд ямар санагддаг тухай асууя.',
    },
  },
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
function whoUsually(flagMostlyMe?: AnswerFlag, other = 'хамтрагч маань'): AnswerOption[] {
  return [
    { value: 'mostly_me', label: 'Ихэвчлэн би', balance: -1, score: 0.4, ...(flagMostlyMe ? { flag: flagMostlyMe } : {}) },
    { value: 'slightly_me', label: 'Арай илүү би', balance: -0.5, score: 0.8 },
    { value: 'equal', label: 'Ойролцоогоор адилхан', balance: 0, score: 1 },
    { value: 'slightly_partner', label: `Арай илүү ${other}`, balance: 0.5, score: 0.8 },
    { value: 'mostly_partner', label: `Ихэвчлэн ${other}`, balance: 1, score: 0.5 },
  ]
}

/** Early-stage wording: the other person is "тэр", not yet "хамтрагч". */
const whoUsuallyEarly = (flagMostlyMe?: AnswerFlag) => whoUsually(flagMostlyMe, 'тэр')

/** Show these questions only on one track (see data/track.ts). */
function onlyFor(track: Track, list: Question[]): Question[] {
  return list.map((q) => ({ ...q, showIf: SHOW_FOR[track] }))
}

function yesNo(yesScore: number, noScore: number, flag?: { on: 'yes' | 'no'; flag: AnswerFlag }): AnswerOption[] {
  return [
    { value: 'yes', label: 'Тийм', score: yesScore, ...(flag?.on === 'yes' ? { flag: flag.flag } : {}) },
    { value: 'no', label: 'Үгүй', score: noScore, ...(flag?.on === 'no' ? { flag: flag.flag } : {}) },
  ]
}

/** Attach caring replies to specific options (shown briefly after the answer is chosen). */
function withReplies(options: AnswerOption[], replies: Record<string, string>): AnswerOption[] {
  return options.map((o) => (replies[o.value] ? { ...o, reply: replies[o.value] } : o))
}

// ---------------------------------------------------------------------------
// Questions — shown in array order. The stage question (basics_type) splits the
// flow: talking/dating get the early-stage set, everyone else the couple set.
// ---------------------------------------------------------------------------

const SETTLED_STAGES: ShowIf = { question: 'basics_type', in: ['living_together', 'engaged', 'married'] }
const DATING_STAGES: ShowIf = { question: 'basics_type', notIn: SETTLED_STAGES.in }

const basicsQuestions: Question[] = [
  // ТАНЫ ТУХАЙ ------------------------------------------------------------------
  {
    id: 'basics_type',
    category: 'basics',
    text: 'Та хоёрын харилцаа одоо ямар шатандаа байна вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'stage'],
    options: [
      { value: 'talking', label: 'Чатлаж, танилцаж байгаа' },
      { value: 'dating', label: 'Болзож байгаа' },
      { value: 'exclusive', label: 'Үерхэж байгаа' },
      { value: 'living_together', label: 'Хамт амьдарч байгаа' },
      { value: 'engaged', label: 'Сүй тавьсан' },
      { value: 'married', label: 'Гэрлэсэн' },
    ],
  },
  {
    id: 'basics_duration',
    category: 'basics',
    text: 'Та хоёр танилцаад хэр удаж байна вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'stage'],
    // Months matter early on; couples who live together, are engaged or married get a scale in years.
    options: [
      { value: 'lt_1m', label: '1 сараас бага', showIf: DATING_STAGES },
      { value: '1_3m', label: '1–3 сар', showIf: DATING_STAGES },
      { value: '3_6m', label: '3–6 сар', showIf: DATING_STAGES },
      { value: '6_12m', label: '6–12 сар', showIf: DATING_STAGES },
      { value: 'lt_1y', label: '1 жилээс бага', showIf: SETTLED_STAGES },
      { value: '1_3y', label: '1–3 жил' },
      { value: '3y_plus', label: '3-аас дээш жил', showIf: DATING_STAGES },
      { value: '3_5y', label: '3–5 жил', showIf: SETTLED_STAGES },
      { value: '5_10y', label: '5–10 жил', showIf: SETTLED_STAGES },
      { value: '10y_plus', label: '10-аас дээш жил', showIf: SETTLED_STAGES },
    ],
  },
  {
    id: 'checkin_communication', category: 'basics', type: 'single_choice',
    text: 'Чухал зүйл ярихад нөгөө хүн тань анхааралтай сонсож, ойлгохыг хичээдэг үү?',
    helper: 'Сүүлийн 2–4 долоо хоногийг бодоорой. Дөнгөж танилцсан бол тэр хугацаагаа бодоорой.',
    analysisTags: ['context', 'checkin', 'communication'],
    options: [
      { value: 'never', label: 'Огт үгүй' },
      { value: 'rarely', label: 'Ховор' },
      { value: 'sometimes', label: 'Заримдаа' },
      { value: 'often', label: 'Ихэнхдээ' },
      { value: 'almost_always', label: 'Бараг үргэлж' },
      { value: 'not_yet', label: 'Одоохондоо хэлж мэдэхгүй / ийм зүйл тохиолдоогүй' },
    ],
  },
  {
    id: 'checkin_effort', category: 'basics', type: 'single_choice',
    text: 'Холбоотой байх, хамт цаг гаргахад та хоёр хоёулаа санаачилга гаргадаг уу?',
    helper: 'Сүүлийн 2–4 долоо хоногийг бодоорой. Дөнгөж танилцсан бол тэр хугацаагаа бодоорой.',
    analysisTags: ['context', 'checkin', 'effort'],
    options: [
      { value: 'never', label: 'Огт үгүй' },
      { value: 'rarely', label: 'Ховор' },
      { value: 'sometimes', label: 'Заримдаа' },
      { value: 'often', label: 'Ихэнхдээ' },
      { value: 'almost_always', label: 'Бараг үргэлж' },
      { value: 'not_yet', label: 'Одоохондоо хэлж мэдэхгүй / ийм зүйл тохиолдоогүй' },
    ],
  },
  {
    id: 'checkin_boundaries', category: 'basics', type: 'single_choice',
    text: 'Та хүсэхгүй зүйлдээ үгүй гэж хэлэхэд таны шийдвэрийг хүндэтгэдэг үү?',
    helper: 'Сүүлийн 2–4 долоо хоногийг бодоорой. Дөнгөж танилцсан бол тэр хугацаагаа бодоорой.',
    analysisTags: ['context', 'checkin', 'boundaries'],
    options: [
      { value: 'never', label: 'Огт үгүй' },
      { value: 'rarely', label: 'Ховор' },
      { value: 'sometimes', label: 'Заримдаа' },
      { value: 'often', label: 'Ихэнхдээ' },
      { value: 'almost_always', label: 'Бараг үргэлж' },
      { value: 'not_yet', label: 'Одоохондоо хэлж мэдэхгүй / ийм зүйл тохиолдоогүй' },
    ],
  },
  {
    id: 'basics_recent_change', category: 'basics', type: 'single_choice',
    text: 'Сүүлийн үед та хоёрын хооронд юу өөрчлөгдсөн бэ?',
    helper: 'Яг одоо ямар байгааг нь бодоорой. Өмнө нь шалгуулсан байсан ч өнөөдрийн байдлаар хариулж болно.',
    analysisTags: ['context', 'trajectory'],
    options: [
      { value: 'closer', label: 'Илүү дотно болж байна' },
      { value: 'steady', label: 'Ерөнхийдөө хэвээрээ' },
      { value: 'distant', label: 'Холдоод байгаа юм шиг санагддаг' },
      { value: 'repairing', label: 'Хэцүү үеийн дараа дахин ойлголцохыг хичээж байна' },
      { value: 'too_soon', label: 'Дүгнэхэд арай эрт байна' },
    ],
  },
  {
    id: 'basics_change_context', category: 'basics', type: 'single_choice',
    text: 'Энэ өөрчлөлттэй давхацсан зүйл бий юу?',
    visibleWhen: [{ question: 'basics_recent_change', in: ['distant', 'repairing'] }],
    analysisTags: ['context', 'recent_stress'],
    options: [
      { value: 'outside_stress', label: 'Ажил, сургууль, эрүүл мэнд эсвэл гэр бүлийн ачаалал' },
      { value: 'between_us', label: 'Та хоёрын хооронд болсон зүйл' },
      { value: 'both', label: 'Аль аль нь' },
      { value: 'unknown', label: 'Шалтгааныг нь сайн мэдэхгүй' },
    ],
  },
  {
    id: 'basics_met_how',
    category: 'basics',
    text: 'Та хоёр хэрхэн танилцсан бэ?',
    type: 'single_choice',
    analysisTags: ['context', 'stage'],
    showIf: SHOW_FOR.early,
    options: [
      { value: 'app', label: 'Танилцах апп-аар' },
      { value: 'social', label: 'Сошиал сүлжээгээр' },
      { value: 'friends', label: 'Найз нөхдөөр дамжуулж' },
      { value: 'work_school', label: 'Ажил эсвэл сургууль дээр' },
      { value: 'other', label: 'Өөр газар' },
    ],
  },
  {
    id: 'basics_met_in_person',
    category: 'basics',
    text: 'Та хоёр биечлэн уулзаж байсан уу?',
    type: 'single_choice',
    analysisTags: ['context', 'time_together'],
    showIf: SHOW_FOR.early,
    options: [
      { value: 'not_yet', label: 'Одоохондоо үгүй, зөвхөн чатладаг' },
      { value: 'once', label: 'Нэг удаа' },
      { value: 'few_times', label: 'Хэд хэдэн удаа' },
      { value: 'regularly', label: 'Тогтмол уулздаг' },
    ],
  },
  {
    id: 'basics_chat_frequency',
    category: 'basics',
    text: 'Та хоёр хэр олон чатлаж, ярьдаг вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'time_together'],
    showIf: { question: 'basics_type', in: ['talking'] },
    options: [
      { value: 'all_day', label: 'Өдөржин бараг тасралтгүй' },
      { value: 'daily', label: 'Өдөр бүр' },
      { value: 'several_week', label: 'Долоо хоногт хэд хэдэн удаа' },
      { value: 'irregular', label: 'Тогтмол бус, хааяа' },
    ],
  },
  {
    id: 'basics_frequency',
    category: 'basics',
    text: 'Одоогоор та хоёр хэр олон уулздаг вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'time_together'],
    // People who are only talking get the chat questions above; couples who share a home get quality time below.
    showIf: { question: 'basics_type', notIn: ['talking', 'living_together', 'married'] },
    options: [
      { value: 'daily', label: 'Бараг өдөр бүр' },
      { value: 'several_week', label: 'Долоо хоногт хэд хэдэн удаа' },
      { value: 'weekly', label: 'Долоо хоногт нэг орчим удаа' },
      { value: 'occasionally', label: 'Хааяа' },
      { value: 'long_distance', label: 'Хол зайнаас харилцдаг' },
    ],
  },
  {
    id: 'basics_quality_time',
    category: 'basics',
    text: 'Та хоёр бие биедээ цаг гаргаж чаддаг уу?',
    helper: 'Ажил, утас зэрэгт сатаарахгүйгээр хамт өнгөрөөдөг цагаа бодоорой.',
    type: 'single_choice',
    analysisTags: ['context', 'time_together', 'quality_time'],
    showIf: { question: 'basics_type', in: ['living_together', 'married'] },
    options: [
      { value: 'daily', label: 'Бараг өдөр бүр' },
      { value: 'several_week', label: 'Долоо хоногт хэд хэдэн удаа' },
      { value: 'weekly', label: 'Долоо хоногт нэг орчим удаа' },
      { value: 'rarely', label: 'Ховор' },
      { value: 'almost_never', label: 'Бараг үгүй' },
    ],
  },
  {
    id: 'basics_gender',
    category: 'basics',
    text: 'Таны хүйс?',
    type: 'single_choice',
    analysisTags: ['context', 'about_user'],
    options: [
      { value: 'female', label: 'Эмэгтэй' },
      { value: 'male', label: 'Эрэгтэй' },
      { value: 'other', label: 'Бусад / хэлэхийг хүсэхгүй байна' },
    ],
  },
  {
    id: 'basics_age',
    category: 'basics',
    text: 'Таны нас?',
    type: 'single_choice',
    analysisTags: ['context', 'about_user'],
    options: [
      { value: '18_24', label: '18–24' },
      { value: '25_29', label: '25–29' },
      { value: '30_34', label: '30–34' },
      { value: '35_44', label: '35–44' },
      { value: '45_plus', label: '45-аас дээш' },
    ],
  },
]

/**
 * About the person themselves — asked in both flows, right after the basics. Not scored:
 * there are no right answers. They personalise the report (e.g. the gap between how someone
 * shows love and how they want to receive it) and the shareable love style.
 */
export const LOVE_LANGUAGES = ['words', 'time', 'acts', 'touch', 'gifts'] as const

const selfQuestions: Question[] = [
  {
    id: 'self_gives_love',
    category: 'self',
    text: 'Та хайраа ихэвчлэн хэрхэн илэрхийлдэг вэ?',
    type: 'single_choice',
    analysisTags: ['about_user', 'love_language', 'gives'],
    options: [
      { value: 'words', label: 'Үгээр — сэтгэлээ хэлж, магтдаг' },
      { value: 'time', label: 'Хамт цаг өнгөрөөж' },
      { value: 'acts', label: 'Тусалж, санаа тавих үйлдлээр' },
      { value: 'touch', label: 'Тэврэх, хүрэлцэх зэргээр' },
      { value: 'gifts', label: 'Жижиг бэлэг, гэнэтийн зүйлээр' },
    ],
  },
  {
    id: 'self_receives_love',
    category: 'self',
    text: 'Танд юу хамгийн их хайрлагдаж байгаа мэдрэмж төрүүлдэг вэ?',
    type: 'single_choice',
    analysisTags: ['about_user', 'love_language', 'receives'],
    options: [
      { value: 'words', label: 'Сайхан үг, талархал сонсох' },
      { value: 'time', label: 'Бүрэн анхаарал, хамт өнгөрөөх цаг' },
      { value: 'acts', label: 'Надад тусалж, санаа тавих нь' },
      { value: 'touch', label: 'Тэврэлт, дотно хүрэлцэл' },
      { value: 'gifts', label: 'Намайг санасныг харуулсан жижиг бэлэг' },
    ],
  },
  {
    id: 'self_when_upset',
    category: 'self',
    text: 'Сэтгэл гонсойход та ихэвчлэн…',
    type: 'single_choice',
    analysisTags: ['about_user', 'conflict_style', 'coping'],
    options: [
      { value: 'talk', label: 'Шууд ярилцахыг хүсдэг' },
      { value: 'space', label: 'Эхлээд ганцаараа бодох хэрэгтэй болдог' },
      { value: 'hold_in', label: 'Дотроо хадгалаад, хэлдэггүй' },
      { value: 'react', label: 'Хурдан бухимдаад, дараа нь тайвширдаг' },
    ],
  },
  {
    id: 'self_need_now',
    category: 'self',
    text: 'Яг одоо танд хамгийн их хэрэгтэй зүйл юу вэ?',
    type: 'single_choice',
    analysisTags: ['about_user', 'needs'],
    options: [
      { value: 'reassurance', label: 'Хайрлагдаж, үнэлэгдэж байгаагаа мэдрэх' },
      { value: 'clarity', label: 'Бид хаашаа явж байгааг тодорхой мэдэх' },
      { value: 'closeness', label: 'Илүү ойр дотно байх' },
      { value: 'space', label: 'Өөртөө илүү орон зай' },
      { value: 'respect', label: 'Сонсогдож, хүндлэгдэх' },
    ],
  },
  {
    id: 'self_past',
    category: 'self',
    text: 'Өмнөх харилцаанаас тань одоо ч нөлөөлж буй зүйл бий юу?',
    helper: 'Хүсвэл л хариулаарай — “Хэлэхийг хүсэхгүй байна” гэж сонгож болно.',
    type: 'single_choice',
    analysisTags: ['about_user', 'history'],
    options: [
      { value: 'none', label: 'Онцгой зүйл байхгүй' },
      { value: 'trust', label: 'Итгэхэд хэцүү болсон' },
      { value: 'fear_leaving', label: 'Орхигдохоос айдаг болсон' },
      { value: 'over_give', label: 'Хэт их зүйл өгдөг болсон' },
      { value: 'guarded', label: 'Сэтгэлээ амархан нээдэггүй болсон' },
      { value: 'prefer_not', label: 'Хэлэхийг хүсэхгүй байна' },
    ],
  },
]

/** Committed relationships: exclusive, living together, engaged, married. */
const coupleQuestions: Question[] = [
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
    visibleWhen: [{ question: 'comm_initiates', in: ['mostly_me', 'slightly_me'] }],
    category: 'communication',
    text: 'Та түрүүлж бичээгүй үед хамтрагч тань өөрөө холбогддог уу?',
    type: 'single_choice',
    analysisTags: ['communication', 'initiation', 'reciprocity'],
    options: [
      { value: 'quickly', label: 'Тэр удалгүй өөрөө холбогддог', score: 1 },
      { value: 'eventually', label: 'Хэсэг хугацааны дараа холбогддог', score: 0.7 },
      { value: 'long_time', label: 'Нэлээд удсаны дараа холбогддог', score: 0.3, flag: 'initiation_imbalance' },
      { value: 'no_contact', label: 'Тэр өөрөө холбогдож байгаагүй', score: 0, flag: 'initiation_imbalance' },
      { value: 'not_yet', label: 'Ийм үе тохиолдоогүй / хэлж мэдэхгүй' },
    ],
  },
  {
    id: 'comm_heard',
    visibleWhen: [{ question: 'checkin_communication', in: ['never', 'rarely', 'sometimes'] }],
    category: 'communication',
    text: 'Дутуу ярилцсан сэдвээ хамтрагч тань дараа нь өөрөө сөхдөг үү?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['communication', 'emotional_support'],
    options: positiveFrequency(),
  },
  {
    id: 'comm_interest',
    visibleWhen: [{ question: 'checkin_communication', in: ['never', 'rarely', 'sometimes'] }],
    category: 'communication',
    text: 'Хамтрагч тань таны бодол, мэдрэмжийг сонирхож асуудаг уу?',
    type: 'scale',
    analysisTags: ['communication', 'emotional_support', 'curiosity'],
    options: positiveFrequency(),
  },
  {
    id: 'comm_share_hurt',
    category: 'communication',
    text: 'Гомдсон зүйлээ хамтрагчдаа айхгүйгээр хэлж чаддаг уу?',
    helper: 'Хэлсний дараа яаж хүлээж авах бол гэж айдаг эсэхээ бодоорой.',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['communication', 'emotional_safety'],
    options: withReplies(positiveFrequency('fear_of_reaction'), {
      never: 'Гомдлоо хэлэхээс эмээх нь ойлгомжтой. Энд та чөлөөтэй байж болно.',
      rarely: 'Гомдлоо хэлэхээс эмээх нь ойлгомжтой. Энд та чөлөөтэй байж болно.',
    }),
  },
  {
    id: 'comm_begging',
    visibleWhen: [{ question: 'checkin_effort', in: ['never', 'rarely', 'sometimes'] }],
    category: 'communication',
    text: 'Анхаарал тавиач гэж дахин дахин гуйх хэрэг гардаг уу?',
    type: 'scale',
    analysisTags: ['communication', 'reciprocity', 'attention'],
    options: withReplies(negativeFrequency('attention_seeking'), {
      often: 'Ийм мэдрэмж хүнийг их ядраадаг. Та ганцаараа биш.',
      almost_always: 'Ийм мэдрэмж хүнийг их ядраадаг. Та ганцаараа биш.',
    }),
  },
  {
    id: 'comm_avoiding',
    visibleWhen: [{ question: 'comm_share_hurt', in: ['never', 'rarely', 'sometimes'] }],
    category: 'communication',
    text: 'Ярилцмаар байгаа ч хэлж зүрхлэхгүй зүйл танд бий юу?',
    type: 'yes_no',
    analysisTags: ['communication', 'avoidance'],
    options: yesNo(0.3, 1),
  },

  // ЭНХРИЙЛЭЛ ----------------------------------------------------------------
  {
    id: 'aff_initiates',
    category: 'affection',
    text: 'Тэврэх, үнсэх зэрэг дотно байдлыг хэн нь түрүүлж санаачилдаг вэ?',
    type: 'single_choice',
    analysisTags: ['affection', 'initiation', 'balance'],
    options: whoUsually(),
  },
  {
    id: 'aff_wanted',
    category: 'affection',
    text: 'Хамтрагч тань тантай дотно байхыг хүсдэг нь мэдрэгддэг үү?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['affection', 'desire', 'security'],
    options: positiveFrequency(),
  },
  {
    id: 'aff_unprompted',
    visibleWhen: [{ question: 'aff_wanted', in: ['never', 'rarely', 'sometimes'] }],
    category: 'affection',
    text: 'Хамтрагч тань өөрөө санаачилж хайр халамжаа илэрхийлдэг үү?',
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
      { value: 'much_closer', label: 'Илүү дотно болсон', score: 1 },
      { value: 'little_closer', label: 'Бага зэрэг дотноссон', score: 0.85 },
      { value: 'same', label: 'Бараг хэвээрээ', score: 0.65 },
      {
        value: 'little_distant',
        label: 'Арай хөндийрсөн',
        score: 0.3,
        flag: 'drifting_apart',
        reply: 'Хөндийрснийг анзаарах амаргүй байж болно. Хуваалцсанд баярлалаа.',
      },
      {
        value: 'much_distant',
        label: 'Нэлээд хөндийрсөн',
        score: 0,
        flag: 'drifting_apart',
        reply: 'Хөндийрснийг анзаарах амаргүй байж болно. Хуваалцсанд баярлалаа.',
      },
    ],
  },
  {
    id: 'aff_share_news',
    visibleWhen: [{ question: 'checkin_communication', in: ['never', 'rarely', 'sometimes'] }],
    category: 'affection',
    text: 'Сайхан мэдээгээ хамтрагчдаа түрүүлж хэлмээр санагддаг уу?',
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

  // ХИЧЭЭЛ ЗҮТГЭЛ ------------------------------------------------------------
  {
    id: 'effort_plans',
    category: 'effort',
    text: 'Хамтдаа юу хийхээ ихэвчлэн хэн нь төлөвлөдөг вэ?',
    type: 'single_choice',
    analysisTags: ['effort', 'initiation', 'balance'],
    options: whoUsually(),
  },
  {
    id: 'effort_resolves',
    category: 'effort',
    text: 'Асуудал гарахад хэн нь шийдэхийг илүү хичээдэг вэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['effort', 'repair', 'balance'],
    options: whoUsually('effort_imbalance'),
  },
  {
    id: 'effort_more',
    visibleWhen: [{ question: 'checkin_effort', in: ['never', 'rarely', 'sometimes'] }],
    category: 'effort',
    text: 'Энэ харилцааны төлөө та илүү их хичээгээд байгаа юм шиг санагддаг уу?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['effort', 'reciprocity', 'balance'],
    options: [
      { value: 'balanced', label: 'Үгүй, тэнцвэртэй санагддаг', score: 1, balance: 0 },
      { value: 'partner_more', label: 'Харин ч хамтрагч маань илүү хичээдэг', score: 0.7, balance: 1 },
      { value: 'sometimes', label: 'Заримдаа', score: 0.6, balance: -0.5 },
      {
        value: 'often',
        label: 'Ихэвчлэн',
        score: 0.25,
        balance: -1,
        flag: 'effort_imbalance',
        reply: 'Ганцаараа хичээх их ядраадаг. Үүнийг анхааралтай харъя.',
      },
      {
        value: 'almost_always',
        label: 'Бараг үргэлж',
        score: 0,
        balance: -1,
        flag: 'effort_imbalance',
        reply: 'Ганцаараа хичээх их ядраадаг. Үүнийг анхааралтай харъя.',
      },
    ],
  },
  {
    id: 'effort_one_week',
    visibleWhen: [{ question: 'effort_more', in: ['often', 'almost_always'] }],
    category: 'effort',
    text: 'Та ачааллаа багасгах хэрэгтэй үед хамтрагч тань яаж хүлээж авдаг вэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['effort', 'reciprocity', 'security'],
    options: [
      { value: 'nothing', label: 'Холбоо, халамж хэвээрээ байдаг', score: 0.8 },
      { value: 'partner_steps_up', label: 'Ойлгож, өөрөө илүү санаачилга гаргадаг', score: 1 },
      { value: 'distant', label: 'Холбоо мэдэгдэхүйц багасдаг', score: 0.3, flag: 'effort_imbalance' },
      {
        value: 'fall_apart',
        label: 'Харилцаа маань нурчих вий гэж айдаг',
        score: 0,
        flag: 'effort_imbalance',
        reply: 'Ийм айдастай явах амаргүй. Үүнийг хамтдаа ойлгоцгооё.',
      },
    ],
  },

  // ИТГЭЛЦЭЛ -----------------------------------------------------------------
  {
    id: 'couple_needs_response', category: 'effort', type: 'single_choice',
    text: 'Хэрэгтэй байгаа зүйлээ хэлэхэд хамтрагч тань яаж хүлээж авдаг вэ?',
    helper: 'Жишээ нь хамт цаг өнгөрөөх, холбоо барих эсвэл өөртөө цаг гаргах тухай.',
    analysisTags: ['reciprocity', 'repair', 'boundaries'],
    options: [
      { value: 'acts', label: 'Сонсож, өөрчлөхийг хичээдэг', score: 1 },
      { value: 'inconsistent', label: 'Сонсдог ч өөрчлөлт нь удаан үргэлжилдэггүй', score: 0.5 },
      { value: 'dismisses', label: 'Үл тоодог эсвэл намайг хэт их зүйл хүсэж байна гэдэг', score: 0.1, flag: 'effort_imbalance' },
      { value: 'afraid', label: 'Яаж хүлээж авахаас нь айгаад хэлж чаддаггүй', score: 0, flag: 'fear_of_reaction' },
      { value: 'not_discussed', label: 'Одоохондоо энэ тухай ярилцаагүй' },
    ],
  },
  {
    id: 'trust_level',
    category: 'trust',
    text: 'Та хамтрагчдаа хэр их итгэдэг вэ?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['trust'],
    options: [
      { value: 'completely', label: 'Бүрэн итгэдэг', score: 1, reply: 'Ийм итгэл харилцаанд маш үнэ цэнтэй.' },
      { value: 'mostly', label: 'Ихэнхдээ итгэдэг', score: 0.75 },
      { value: 'somewhat', label: 'Зарим талаар', score: 0.45 },
      { value: 'a_little', label: 'Бага зэрэг', score: 0.2 },
      { value: 'not_at_all', label: 'Огт итгэдэггүй', score: 0 },
    ],
  },
  {
    id: 'trust_lose_interest',
    category: 'trust',
    text: 'Хамтрагч тань танд сонирхолгүй болох вий гэж санаа зовдог уу?',
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
    text: 'Хамтрагч тань итгэлийг тань алдах зүйл хийж байсан уу?',
    helper: 'Таамаг биш, болсон явдлыг бодоорой.',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['trust', 'fidelity', 'history'],
    options: [
      { value: 'no', label: 'Үгүй', score: 1 },
      { value: 'small_things', label: 'Хэдэн жижиг зүйл', score: 0.6 },
      {
        value: 'significant',
        label: 'Тийм, ноцтой зүйл',
        score: 0.15,
        flag: 'trust_breach',
        reply: 'Үүнийг хуваалцсанд баярлалаа. Энэ амаргүй зүйл.',
      },
      {
        value: 'multiple',
        label: 'Олон удаа',
        score: 0,
        flag: 'trust_breach',
        reply: 'Үүнийг хуваалцсанд баярлалаа. Энэ амаргүй зүйл.',
      },
    ],
  },
  {
    id: 'trust_time_apart',
    category: 'trust',
    text: 'Хамтрагчаасаа тусдаа байхдаа та хэр тайван байдаг вэ?',
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
      { value: 'never', label: 'Одоохондоо ноцтой маргалдаж байгаагүй' },
      { value: 'rarely', label: 'Ховор', score: 1 },
      { value: 'few_year', label: 'Жилд хэдхэн удаа', score: 0.8 },
      { value: 'monthly', label: 'Сард нэг орчим', score: 0.55 },
      { value: 'weekly', label: 'Долоо хоногт нэг орчим', score: 0.25 },
      { value: 'several_week', label: 'Долоо хоногт хэд хэдэн удаа', score: 0 },
    ],
  },
  {
    id: 'conflict_harm',
    category: 'conflict',
    text: 'Маргааны үеэр хэн нэг нь нөгөөгөө доромжилж, гутааж эсвэл сүрдүүлдэг үү?',
    helper: 'Шоолох, зориуд эвгүй байдалд оруулах зэрэг үйлдлийг ч бодоорой.',
    type: 'single_choice',
    weight: 2,
    analysisTags: ['conflict', 'respect', 'safety'],
    options: [
      { value: 'never', label: 'Үгүй, хэзээ ч', score: 1 },
      { value: 'once_or_twice', label: 'Нэг хоёр удаа тохиолдсон', score: 0.4, flag: 'harmful_conflict', reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.' },
      { value: 'sometimes', label: 'Тийм, заримдаа', score: 0.1, flag: 'harmful_conflict', reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.' },
      { value: 'often', label: 'Тийм, байнга', score: 0, flag: 'harmful_conflict', reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.' },
    ],
  },
  {
    id: 'conflict_after',
    visibleWhen: [{ question: 'conflict_frequency', notIn: ['never'] }],
    category: 'conflict',
    text: 'Маргааны дараа ихэвчлэн юу болдог вэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['conflict', 'repair'],
    options: [
      { value: 'resolve', label: 'Бид ярилцаж, шийддэг', score: 1, reply: 'Ярилцаад шийдэлд хүрч чаддаг нь чухал.' },
      { value: 'apologize', label: 'Бидний нэг нь уучлалт гуйдаг', score: 0.7 },
      { value: 'ignore', label: 'Юу ч болоогүй юм шиг байдаг', score: 0.35 },
      { value: 'gives_in', label: 'Нэг нь бууж өгдөг', score: 0.3 },
      { value: 'stop_talking', label: 'Хэсэг хугацаанд ярихаа больдог', score: 0.2 },
      { value: 'unresolved', label: 'Хэзээ ч бүрэн шийдэгддэггүй', score: 0, flag: 'unresolved_conflict' },
    ],
  },
  {
    id: 'conflict_recurring',
    visibleWhen: [{ question: 'conflict_frequency', notIn: ['never'] }],
    category: 'conflict',
    text: 'Ижил асуудлаас болж дахин дахин маргалддаг уу?',
    type: 'scale',
    analysisTags: ['conflict', 'repair', 'patterns'],
    options: negativeFrequency('unresolved_conflict'),
  },
  {
    id: 'conflict_reach_out',
    visibleWhen: [{ question: 'conflict_frequency', notIn: ['never'] }],
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
    text: 'Харилцаанаасаа гадна өөрийн амьдралдаа цаг гаргаж чаддаг уу?',
    helper: 'Найз нөхөд, сонирхдог зүйлс, өөрийн зорилгодоо гаргадаг цагаа бодоорой.',
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
    text: 'Хамтрагч тань хэдэн цаг хариу бичихгүй бол хэр их санаа зовдог вэ?',
    type: 'single_choice',
    analysisTags: ['independence', 'anxiety', 'security'],
    options: [
      { value: 'not_at_all', label: 'Огт санаа зовдоггүй', score: 1 },
      { value: 'slightly', label: 'Бага зэрэг', score: 0.75 },
      { value: 'moderately', label: 'Дунд зэрэг', score: 0.45 },
      { value: 'very', label: 'Маш их', score: 0.2, flag: 'emotional_dependence' },
      { value: 'extremely', label: 'Туйлын их', score: 0, flag: 'emotional_dependence' },
    ],
  },
  {
    id: 'indep_mood',
    visibleWhen: [{ question: 'indep_anxiety', in: ['moderately', 'very', 'extremely'] }],
    category: 'independence',
    text: 'Хамтрагчийн тань харьцаанаас тухайн өдрийн сэтгэл санаа тань их хамаардаг уу?',
    type: 'scale',
    analysisTags: ['independence', 'emotional_regulation'],
    options: negativeFrequency('emotional_dependence'),
  },

  // ИРЭЭДҮЙ ------------------------------------------------------------------
  {
    id: 'future_shared_decisions', category: 'future', type: 'single_choice',
    text: 'Хамтын амьдралын чухал шийдвэрт таны саналыг хэр тусгадаг вэ?',
    helper: 'Мөнгө, амьдрах газар эсвэл өдөр тутмын үүргээ хэрхэн шийддэгээ бодоорой.',
    visibleWhen: [{ question: 'basics_type', in: ['living_together', 'engaged', 'married'] }],
    analysisTags: ['future', 'shared_decisions', 'reciprocity'],
    options: [
      { value: 'together', label: 'Хоёулангийн саналыг сонсож, хамт шийддэг', score: 1 },
      { value: 'uneven', label: 'Заримдаа нэгнийх нь санал илүү давамгайлдаг', score: 0.5 },
      { value: 'excluded', label: 'Миний саналыг бараг асуудаггүй', score: 0.1, flag: 'effort_imbalance' },
      { value: 'not_yet', label: 'Одоохондоо ийм шийдвэр гаргаагүй' },
    ],
  },
  {
    id: 'future_readiness', category: 'future', type: 'single_choice',
    text: 'Гэрлэх тухай бодоход танд одоо ямар санагддаг вэ?',
    visibleWhen: [{ question: 'basics_type', in: ['engaged'] }],
    analysisTags: ['future', 'readiness', 'boundaries'],
    options: [
      { value: 'ready', label: 'Өөрөө хүсэж байгаа, шийдвэртээ итгэлтэй байна', score: 1 },
      { value: 'questions', label: 'Хүсэж байгаа ч эхлээд ярилцах зүйлс бий', score: 0.6 },
      { value: 'more_time', label: 'Надад илүү хугацаа хэрэгтэй' },
      { value: 'pressure', label: 'Бусдын хүлээлт, шахалтаас болж зөвшөөрсөн мэт санагддаг', score: 0, flag: 'boundary_pressure' },
    ],
  },
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
    text: 'Ирээдүйн тухай та хоёрын хүсэл, төлөвлөгөө хэр нийцдэг вэ?',
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
    text: 'Энэ хүнтэй ирээдүйгээ хамт төсөөлж чаддаг уу?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['future', 'commitment'],
    options: [
      { value: 'definitely', label: 'Мэдээж', score: 1 },
      { value: 'probably', label: 'Магадгүй', score: 0.75 },
      { value: 'not_sure', label: 'Сайн мэдэхгүй', score: 0.4 },
      { value: 'probably_not', label: 'Үгүй байх', score: 0.15 },
      { value: 'no', label: 'Үгүй', score: 0 },
    ],
  },
  {
    id: 'future_included',
    category: 'future',
    text: 'Хамтрагч тань ирээдүйнхээ төлөвлөгөөнд таныг багтаадаг уу?',
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
    text: 'Харилцаа тань энэ хэвээрээ 3 жил үргэлжилбэл танд ямар санагдах вэ?',
    type: 'single_choice',
    weight: 2,
    analysisTags: ['future', 'satisfaction', 'overall'],
    options: [
      { value: 'very_happy', label: 'Маш сайхан санагдана', score: 1, reply: 'Сайхан байна. Энэ бол маш том давуу тал.' },
      { value: 'mostly_happy', label: 'Ерөнхийдөө сайхан санагдана', score: 0.75 },
      { value: 'unsure', label: 'Эргэлзэж байна', score: 0.4 },
      { value: 'unhappy', label: 'Сэтгэл хангалуун биш байна', score: 0.15, flag: 'status_quo_unhappy', reply: 'Хуваалцсанд баярлалаа. Өөрчлөлт хүсэж болно.' },
      { value: 'would_not_want', label: 'Би ийм байхыг хүсэхгүй', score: 0, flag: 'status_quo_unhappy', reply: 'Хуваалцсанд баярлалаа. Өөрчлөлт хүсэж болно.' },
    ],
  },
  {
    id: 'final_wish',
    category: 'future',
    text: 'Таны мэдрэмжийн талаар хамтрагч тань юуг ойлгоосой гэж хүсдэг вэ?',
    helper: 'Заавал биш. Нэр болон таныг таних боломжтой мэдээлэл бичихгүй байхыг хүсье.',
    type: 'text',
    optional: true,
    placeholder: 'Хүссэн хэмжээгээрээ бичээрэй…',
    maxLength: 1000,
    analysisTags: ['open_reflection'],
  },
]

/**
 * Talking / dating: people getting to know each other who mostly want to know
 * whether this could work. Focus on mutual interest, consistency, intentions,
 * respect and fit — the early signals that matter most.
 */
const earlyQuestions: Question[] = [
  // ХАРИЛЦАН СОНИРХОЛ --------------------------------------------------------
  {
    id: 'int_initiates',
    category: 'interest',
    text: 'Ихэвчлэн хэн нь түрүүлж бичдэг вэ?',
    type: 'single_choice',
    analysisTags: ['interest', 'initiation', 'balance'],
    options: whoUsuallyEarly('initiation_imbalance'),
  },
  {
    id: 'int_if_not_first',
    visibleWhen: [{ question: 'int_initiates', in: ['mostly_me', 'slightly_me'] }],
    category: 'interest',
    text: 'Та түрүүлж бичээгүй үед тэр өөрөө холбогддог уу?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['interest', 'initiation', 'reciprocity'],
    options: [
      { value: 'quickly', label: 'Тэр удалгүй өөрөө бичдэг', score: 1 },
      { value: 'eventually', label: 'Нэг хоёр хоногийн дараа бичдэг', score: 0.6 },
      { value: 'rarely', label: 'Ховор бичдэг', score: 0.2, flag: 'initiation_imbalance' },
      {
        value: 'never',
        label: 'Бараг хэзээ ч бичдэггүй',
        score: 0,
        flag: 'initiation_imbalance',
        reply: 'Ойлголоо. Ганцаараа холбоог барих их ядраадаг. Үүнийг тайландаа тодорхой харна.',
      },
      { value: 'always_me', label: 'Мэдэхгүй — үргэлж би түрүүлж бичдэг' },
    ],
  },
  {
    id: 'int_questions',
    category: 'interest',
    text: 'Тэр таны амьдрал, бодлыг сонирхож асуудаг уу?',
    type: 'scale',
    weight: 1.25,
    analysisTags: ['interest', 'curiosity', 'reciprocity'],
    options: positiveFrequency(),
  },
  {
    id: 'int_plans',
    visibleWhen: [{ question: 'basics_met_in_person', in: ['once', 'few_times', 'regularly'] }],
    category: 'interest',
    text: 'Уулзах эсвэл хамт юм хийх саналыг хэн нь гаргадаг вэ?',
    type: 'single_choice',
    analysisTags: ['interest', 'effort', 'balance'],
    options: whoUsuallyEarly(),
  },
  {
    id: 'int_reply',
    visibleWhen: [{ question: 'checkin_communication', in: ['never', 'rarely', 'sometimes'] }],
    category: 'interest',
    text: 'Тэр ихэвчлэн яаж хариу бичдэг вэ?',
    type: 'single_choice',
    analysisTags: ['interest', 'communication'],
    options: [
      { value: 'engaged', label: 'Хурдан хариулж, яриа өрнүүлдэг', score: 1 },
      { value: 'slow_warm', label: 'Удаж хариулдаг ч анхаарал тавьж ярилцдаг', score: 0.8 },
      { value: 'short', label: 'Товчхон, нэг хоёр үгээр', score: 0.3 },
      { value: 'varies', label: 'Заримдаа идэвхтэй, заримдаа алга болчихдог', score: 0.2, flag: 'mixed_signals' },
    ],
  },

  // ТОГТВОРТОЙ БАЙДАЛ --------------------------------------------------------
  {
    id: 'cons_hot_cold',
    category: 'consistency',
    text: 'Тэр дотно харьцаж байснаа гэнэт хөндий болдог уу?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['consistency', 'mixed_signals'],
    options: withReplies(negativeFrequency('mixed_signals'), {
      often: 'Ийм байдал хүнийг их эргэлзүүлдэг. Эргэлзэж байгаагаа хэлж болно.',
      almost_always: 'Ийм байдал хүнийг их эргэлзүүлдэг. Эргэлзэж байгаагаа хэлж болно.',
    }),
  },
  {
    id: 'cons_disappear',
    visibleWhen: [{ question: 'cons_hot_cold', in: ['sometimes', 'often', 'almost_always'] }],
    category: 'consistency',
    text: 'Тэр хэлэлгүйгээр хэд хоног холбоо тасалдаг уу?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['consistency', 'reliability'],
    options: [
      { value: 'never', label: 'Үгүй', score: 1 },
      { value: 'once', label: 'Нэг удаа болсон', score: 0.6 },
      { value: 'few_times', label: 'Хэд хэдэн удаа', score: 0.2, flag: 'disappearing' },
      {
        value: 'often',
        label: 'Байнга',
        score: 0,
        flag: 'disappearing',
        reply: 'Хариу хүлээж суух их хэцүү. Таны мэдрэмж бүрэн ойлгомжтой.',
      },
    ],
  },
  {
    id: 'cons_follow_through',
    category: 'consistency',
    text: 'Уулзахаар тохирсон бол тэр хэлсэндээ хүрдэг үү?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['consistency', 'reliability', 'effort'],
    options: [
      { value: 'always', label: 'Тийм, үргэлж', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ', score: 0.75 },
      { value: 'reschedules', label: 'Заримдаа цуцалдаг ч өөр цаг санал болгодог', score: 0.55 },
      { value: 'cancels', label: 'Ихэвчлэн цуцалдаг эсвэл тодорхойгүй болгодог', score: 0.1, flag: 'mixed_signals' },
      { value: 'not_yet', label: 'Одоохондоо уулзахаар тохироогүй' },
    ],
  },
  {
    id: 'cons_words_actions',
    category: 'consistency',
    text: 'Түүний хэлсэн үг, хийсэн үйлдэл нийцдэг үү?',
    type: 'scale',
    weight: 1.25,
    analysisTags: ['consistency', 'trust'],
    options: positiveFrequency('mixed_signals'),
  },
  {
    id: 'cons_trend',
    visibleWhen: [{ question: 'basics_duration', notIn: ['lt_1m'] }],
    category: 'consistency',
    text: 'Анх танилцсанаас хойш түүний сонирхол хэр өөрчлөгдсөн бэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['consistency', 'trajectory'],
    options: [
      { value: 'growing', label: 'Улам нэмэгдэж байна', score: 1 },
      { value: 'steady', label: 'Тогтвортой хэвээрээ', score: 0.8 },
      { value: 'fading', label: 'Бага зэрэг буурсан', score: 0.3, flag: 'fading_interest' },
      {
        value: 'much_less',
        label: 'Мэдэгдэхүйц буурсан',
        score: 0,
        flag: 'fading_interest',
        reply: 'Ийм өөрчлөлтийг анзаарах амаргүй. Үнэнээ хэлсэнд баярлалаа.',
      },
    ],
  },

  // ХОЛБОО -------------------------------------------------------------------
  {
    id: 'early_needs_response', category: 'consistency', type: 'single_choice',
    text: 'Хэрэгтэй байгаа зүйлээ хэлэхэд тэр яаж хүлээж авдаг вэ?',
    helper: 'Жишээ нь хамт цаг өнгөрөөх, холбоо барих эсвэл өөртөө цаг гаргах тухай.',
    analysisTags: ['reciprocity', 'repair', 'boundaries'],
    options: [
      { value: 'acts', label: 'Сонсож, өөрчлөхийг хичээдэг', score: 1 },
      { value: 'inconsistent', label: 'Сонсдог ч өөрчлөлт нь удаан үргэлжилдэггүй', score: 0.5 },
      { value: 'dismisses', label: 'Үл тоодог эсвэл намайг хэт их зүйл хүсэж байна гэдэг', score: 0.1, flag: 'effort_imbalance' },
      { value: 'afraid', label: 'Яаж хүлээж авахаас нь айгаад хэлж чаддаггүй', score: 0, flag: 'fear_of_reaction' },
      { value: 'not_discussed', label: 'Одоохондоо энэ тухай ярилцаагүй' },
    ],
  },
  {
    id: 'conn_flow',
    category: 'connection',
    text: 'Та хоёрын яриа хэр нийлдэг вэ?',
    type: 'single_choice',
    analysisTags: ['connection', 'communication'],
    options: [
      { value: 'effortless', label: 'Маш сайн, яриад суухад цаг хурдан өнгөрдөг', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ сайн', score: 0.75 },
      { value: 'mixed', label: 'Заримдаа нийлдэг, заримдаа ярих зүйл олддоггүй', score: 0.45 },
      { value: 'forced', label: 'Ихэвчлэн би л яриа үргэлжлүүлэх гэж хичээдэг', score: 0.15, flag: 'initiation_imbalance' },
    ],
  },
  {
    id: 'conn_laugh',
    visibleWhen: [{ question: 'conn_flow', in: ['forced', 'mixed'] }],
    category: 'connection',
    text: 'Та хоёр хамтдаа инээлдэж, хөгжилддөг үү?',
    type: 'scale',
    analysisTags: ['connection', 'fun'],
    options: positiveFrequency(),
  },
  {
    id: 'conn_yourself',
    category: 'connection',
    text: 'Түүнтэй харилцахдаа та өөрөөрөө байж чаддаг уу?',
    type: 'scale',
    weight: 1.25,
    analysisTags: ['connection', 'authenticity', 'emotional_safety'],
    options: positiveFrequency('self_silencing'),
  },
  {
    id: 'conn_attraction',
    category: 'connection',
    text: 'Та түүнд хэр их татагддаг вэ?',
    type: 'single_choice',
    analysisTags: ['connection', 'attraction'],
    options: [
      { value: 'strongly', label: 'Маш их', score: 1 },
      { value: 'quite', label: 'Нэлээд', score: 0.8 },
      { value: 'growing', label: 'Аажмаар нэмэгдэж байна', score: 0.75 },
      { value: 'unsure', label: 'Сайн мэдэхгүй', score: 0.35 },
      { value: 'not_really', label: 'Тийм ч их биш', score: 0.1 },
    ],
  },

  // ЗОРИЛГО ------------------------------------------------------------------
  {
    id: 'intent_you',
    category: 'intentions',
    text: 'Та энэ хүнтэй ямар харилцаатай байхыг хүсэж байна вэ?',
    type: 'single_choice',
    analysisTags: ['intentions', 'about_user'],
    // Context: no "right" answer, so not scored. Compared with intent_them in the teaser.
    options: [
      { value: 'serious', label: 'Тогтвортой, урт хугацааны харилцаа' },
      { value: 'see', label: 'Юу болохыг харъя гэж бодож байна' },
      { value: 'casual', label: 'Урт хугацааны амлалтгүйгээр болзох' },
      { value: 'unsure', label: 'Одоохондоо мэдэхгүй' },
    ],
  },
  {
    id: 'intent_them',
    category: 'intentions',
    text: 'Тэр ямар харилцаа хүсэж байна гэж хэлсэн бэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['intentions', 'about_other'],
    options: [
      { value: 'serious', label: 'Тогтвортой, урт хугацааны харилцаа' },
      { value: 'see', label: 'Юу болохыг харъя гэж байгаа' },
      { value: 'casual', label: 'Урт хугацааны амлалтгүйгээр болзох' },
      { value: 'unclear', label: 'Одоохондоо тодорхой хэлээгүй' },
    ],
  },
  {
    id: 'intent_discussed',
    category: 'intentions',
    text: 'Ямар харилцаа хүсэж байгаагаа та хоёр ярилцсан уу?',
    type: 'single_choice',
    analysisTags: ['intentions', 'communication'],
    options: [
      { value: 'clearly', label: 'Тийм, нээлттэй ярилцсан', score: 1 },
      { value: 'hinted', label: 'Цухас ярьж байсан', score: 0.55 },
      { value: 'not_yet', label: 'Одоохондоо үгүй' },
      {
        value: 'avoids',
        label: 'Би асуухад тэр сэдвээ өөрчилдөг',
        score: 0,
        flag: 'unclear_intentions',
        reply: 'Тэр юу хүсэж байгааг мэдэхийг хүсэх нь ойлгомжтой.',
      },
    ],
  },
  {
    id: 'intent_exclusive',
    category: 'intentions',
    text: 'Зөвхөн бие биетэйгээ болзох эсэхээ та хоёр тохирсон уу?',
    type: 'single_choice',
    analysisTags: ['intentions', 'exclusivity'],
    options: [
      { value: 'agreed', label: 'Тийм, бид тохиролцсон', score: 1 },
      { value: 'assume', label: 'Тийм гэж бодож байгаа ч ярилцаагүй', score: 0.55 },
      { value: 'open', label: 'Бусадтай ч болзож болно гэж тохирсон', score: 1 },
      { value: 'dont_know', label: 'Мэдэхгүй, энэ нь намайг зовоодог', score: 0.2, flag: 'unclear_intentions' },
    ],
  },
  {
    id: 'intent_public',
    visibleWhen: [{ question: 'basics_duration', notIn: ['lt_1m'] }],
    category: 'intentions',
    text: 'Түүний найз нөхөд таны тухай мэдэх үү?',
    type: 'single_choice',
    analysisTags: ['intentions', 'commitment'],
    options: [
      { value: 'introduced', label: 'Тийм, танилцуулсан', score: 1 },
      { value: 'talks', label: 'Миний тухай ярьдаг гэдгийг мэднэ', score: 0.8 },
      { value: 'too_early', label: 'Одоохондоо эрт байна' },
      { value: 'hides', label: 'Намайг нуудаг юм шиг санагддаг', score: 0, flag: 'unclear_intentions' },
    ],
  },
  {
    id: 'intent_pace',
    category: 'intentions',
    text: 'Та хоёр хэр хурдан дотносож байгаа нь танд ямар санагддаг вэ?',
    type: 'single_choice',
    analysisTags: ['intentions', 'pace'],
    options: [
      { value: 'right', label: 'Яг тохирсон', score: 1 },
      { value: 'slow_ok', label: 'Удаан ч надад зүгээр', score: 0.8 },
      { value: 'too_slow', label: 'Хэт удаан, урагшлахгүй байгаа юм шиг', score: 0.35 },
      { value: 'too_fast', label: 'Хэт хурдан, намайг шахаж байгаа юм шиг', score: 0.2, flag: 'boundary_pressure' },
    ],
  },

  // ХҮНДЭТГЭЛ ----------------------------------------------------------------
  {
    id: 'resp_boundaries',
    category: 'respect',
    text: 'Таныг «үгүй» гэхэд тэр хүндэтгэж хүлээж авдаг уу?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['respect', 'boundaries'],
    options: [
      { value: 'always', label: 'Тийм, үргэлж', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ', score: 0.75 },
      { value: 'pushes', label: 'Заримдаа шахаж, ятгадаг', score: 0.2, flag: 'boundary_pressure' },
      { value: 'not_yet', label: 'Одоохондоо ийм зүйл гараагүй' },
    ],
  },
  {
    id: 'resp_pressure',
    category: 'respect',
    text: 'Тэр таныг бэлэн биш зүйлд шахаж байсан уу?',
    helper: 'Жишээ нь дотно харилцаанд орох, зураг явуулах эсвэл уулзахыг шаардах.',
    type: 'single_choice',
    weight: 2,
    analysisTags: ['respect', 'boundaries', 'safety'],
    options: [
      { value: 'never', label: 'Үгүй, хэзээ ч', score: 1 },
      { value: 'once', label: 'Нэг удаа', score: 0.35, flag: 'boundary_pressure', reply: 'Хуваалцсанд баярлалаа. Та хүсээгүй зүйлдээ зөвшөөрөх албагүй.' },
      { value: 'sometimes', label: 'Заримдаа', score: 0.1, flag: 'boundary_pressure', reply: 'Хуваалцсанд баярлалаа. Та хүсээгүй зүйлдээ зөвшөөрөх албагүй.' },
      { value: 'often', label: 'Байнга', score: 0, flag: 'boundary_pressure', reply: 'Хуваалцсанд баярлалаа. Та хүсээгүй зүйлдээ зөвшөөрөх албагүй.' },
    ],
  },
  {
    id: 'resp_control',
    category: 'respect',
    text: 'Хаана, хэнтэй байгааг тань шалгах, хардах үе гардаг уу?',
    type: 'scale',
    weight: 1.5,
    analysisTags: ['respect', 'control', 'safety'],
    options: negativeFrequency('early_control'),
  },
  {
    id: 'resp_disagree',
    category: 'respect',
    text: 'Санал зөрөхөд тэр яаж ханддаг вэ?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['respect', 'conflict_style'],
    options: [
      { value: 'calm', label: 'Тайван, хүндэтгэлтэй', score: 1 },
      { value: 'defensive', label: 'Өөрийгөө зөвтгөх гээд байдаг', score: 0.6 },
      { value: 'withdraws', label: 'Дуугүй болж, алга болдог', score: 0.3, flag: 'disappearing' },
      {
        value: 'harsh',
        label: 'Доромжилдог, шоолдог эсвэл их уурладаг',
        score: 0,
        flag: 'harmful_conflict',
        reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.',
      },
      { value: 'not_yet', label: 'Одоохондоо санал зөрөөгүй' },
    ],
  },
  {
    id: 'resp_honest',
    category: 'respect',
    text: 'Тэр танд үнэнээ хэлдэг гэж боддог уу?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['respect', 'honesty', 'trust'],
    options: [
      { value: 'yes', label: 'Тийм', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ', score: 0.75 },
      { value: 'unsure', label: 'Сайн мэдэхгүй', score: 0.4 },
      { value: 'caught_lying', label: 'Худал хэлж байсныг нь мэдсэн', score: 0, flag: 'trust_breach' },
    ],
  },

  // НИЙЦЭЛ -------------------------------------------------------------------
  {
    id: 'val_lifestyle',
    category: 'values',
    text: 'Та хоёрын өдөр тутмын амьдралын хэв маяг хэр нийцдэг вэ?',
    helper: 'Ажлын цаг, амралт, найз нөхөдтэйгөө өнгөрөөх цаг зэргээ бодоорой.',
    type: 'single_choice',
    analysisTags: ['values', 'lifestyle'],
    options: [
      { value: 'very', label: 'Маш сайн нийцдэг', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ нийцдэг', score: 0.75 },
      { value: 'some', label: 'Зарим талаар', score: 0.45 },
      { value: 'very_different', label: 'Их ялгаатай', score: 0.15, flag: 'values_mismatch' },
    ],
  },
  {
    id: 'val_core',
    category: 'values',
    text: 'Чухал зүйлсийн талаар та хоёрын үзэл бодол хэр нийцдэг вэ?',
    helper: 'Жишээ нь гэр бүл, итгэл үнэмшил, мөнгөнд хандах хандлага.',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['values', 'beliefs'],
    options: [
      { value: 'very', label: 'Маш сайн нийцдэг', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ нийцдэг', score: 0.75 },
      { value: 'dont_know', label: 'Одоохондоо мэдэхгүй', score: 0.45 },
      { value: 'some', label: 'Зарим нь ялгаатай', score: 0.35 },
      { value: 'very_different', label: 'Их ялгаатай', score: 0.1, flag: 'values_mismatch' },
    ],
  },
  {
    id: 'val_future',
    category: 'values',
    text: 'Та хоёрын ирээдүйн төлөвлөгөө хэр нийцдэг вэ?',
    helper: 'Хүүхэдтэй болох, гэрлэх, хаана амьдрах зэрэг ярилцсан зүйлсээ бодоорой.',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['values', 'future', 'alignment'],
    options: [
      { value: 'align', label: 'Тийм, нийцдэг', score: 1 },
      { value: 'probably', label: 'Нийцэх байх', score: 0.75 },
      { value: 'not_discussed', label: 'Одоохондоо ярилцаагүй', score: 0.45 },
      { value: 'differ', label: 'Ялгаатай юм шиг', score: 0.1, flag: 'values_mismatch' },
    ],
  },
  {
    id: 'val_habits',
    category: 'values',
    text: 'Түүний ямар нэг зуршил таны санааг зовоодог уу?',
    helper: 'Жишээ нь архи уух, мөрийтэй тоглох эсвэл мөнгөө хэт үрэх.',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['values', 'habits', 'safety'],
    options: [
      { value: 'no', label: 'Үгүй', score: 1 },
      { value: 'a_little', label: 'Бага зэрэг', score: 0.55 },
      { value: 'yes', label: 'Тийм, нэлээд', score: 0.1, flag: 'concerning_habits' },
    ],
  },
  {
    id: 'val_others_view',
    visibleWhen: [{ question: 'val_habits', in: ['yes', 'a_little'] }],
    category: 'values',
    text: 'Таны ойр дотны хүмүүс түүний талаар юу гэж боддог вэ?',
    type: 'single_choice',
    analysisTags: ['values', 'social_circle'],
    options: [
      { value: 'like', label: 'Тэд түүнд дуртай', score: 1 },
      { value: 'neutral', label: 'Тодорхой юм хэлээгүй', score: 0.7 },
      { value: 'havent_met', label: 'Тэд түүнийг сайн мэдэхгүй' },
      { value: 'worried', label: 'Тэд санаа зовж байгаа', score: 0.2, flag: 'others_concerned' },
    ],
  },

  // ТАНЫ МЭДРЭМЖ -------------------------------------------------------------
  {
    id: 'feel_waiting',
    category: 'feelings',
    text: 'Хариуг нь хүлээхдээ хэр их санаа зовдог вэ?',
    type: 'single_choice',
    analysisTags: ['feelings', 'anxiety'],
    options: [
      { value: 'not_at_all', label: 'Огт санаа зовдоггүй', score: 1 },
      { value: 'slightly', label: 'Бага зэрэг', score: 0.75 },
      { value: 'moderately', label: 'Дунд зэрэг', score: 0.45 },
      { value: 'very', label: 'Маш их', score: 0.15, flag: 'overthinking' },
    ],
  },
  {
    id: 'feel_overthink',
    visibleWhen: [{ question: 'feel_waiting', in: ['moderately', 'very'] }],
    category: 'feelings',
    text: 'Түүний мессежийг юу гэсэн бол гэж дахин дахин уншдаг уу?',
    type: 'scale',
    analysisTags: ['feelings', 'anxiety', 'overthinking'],
    options: negativeFrequency('overthinking'),
  },
  {
    id: 'feel_change_self',
    visibleWhen: [{ question: 'conn_yourself', in: ['never', 'rarely', 'sometimes'] }],
    category: 'feelings',
    text: 'Түүнд таалагдахын тулд өөрийн хүсэл, бодлыг нуух үе гардаг уу?',
    type: 'scale',
    weight: 1.25,
    analysisTags: ['feelings', 'authenticity', 'self_worth'],
    options: negativeFrequency('self_silencing'),
  },
  {
    id: 'feel_after',
    category: 'feelings',
    text: 'Түүнтэй ярилцаж, уулзсаны дараа танд ихэвчлэн ямар санагддаг вэ?',
    type: 'single_choice',
    weight: 1.5,
    analysisTags: ['feelings', 'wellbeing'],
    options: [
      { value: 'happy', label: 'Баяртай, тайван', score: 1, reply: 'Сайхан байна. Энэ бол чухал дохио.' },
      { value: 'excited_anxious', label: 'Сэтгэл хөдөлсөн ч жаахан түгшүүртэй', score: 0.55 },
      { value: 'confused', label: 'Эргэлзээтэй, ойлгомжгүй', score: 0.2, flag: 'mixed_signals' },
      {
        value: 'drained',
        label: 'Ядарсан эсвэл гунигтай',
        score: 0,
        flag: 'feeling_drained',
        reply: 'Үүнийг анзаарсан нь чухал. Таны мэдрэмж танд их зүйлийг хэлж байна.',
      },
    ],
  },
  {
    id: 'feel_gut',
    category: 'feelings',
    text: 'Энэ хүний тухай бодоход танд ерөнхийдөө ямар санагддаг вэ?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['feelings', 'intuition', 'overall'],
    options: [
      { value: 'good', label: 'Сайхан санагддаг', score: 1 },
      { value: 'hopeful_unsure', label: 'Найдвар байгаа ч эргэлзээтэй', score: 0.55 },
      { value: 'dont_know', label: 'Мэдэхгүй', score: 0.45 },
      { value: 'worried', label: 'Санаа зовж байна', score: 0.15 },
    ],
  },
  {
    id: 'feel_three_months',
    category: 'feelings',
    text: 'Энэ байдал дахиад 3 сар үргэлжилбэл та сэтгэл хангалуун байх уу?',
    type: 'single_choice',
    weight: 2,
    analysisTags: ['feelings', 'satisfaction', 'overall'],
    options: [
      { value: 'yes', label: 'Тийм, баяртай байна', score: 1 },
      { value: 'mostly', label: 'Ихэнхдээ', score: 0.75 },
      { value: 'unsure', label: 'Эргэлзэж байна', score: 0.4 },
      { value: 'no', label: 'Үгүй, илүү ихийг хүсэж байна', score: 0.1, flag: 'status_quo_unhappy' },
    ],
  },
  {
    id: 'early_final',
    category: 'feelings',
    text: 'Энэ хүний талаар өөр юу хуваалцмаар байна вэ?',
    helper: 'Заавал бичих хэрэггүй. Сайхан санагддаг эсвэл санаа зовоодог зүйл байж болно. Нэр, утас зэрэг хувийн мэдээлэл бүү бичээрэй.',
    type: 'text',
    optional: true,
    placeholder: 'Хүссэн хэмжээгээрээ бичээрэй…',
    maxLength: 1000,
    analysisTags: ['open_reflection'],
  },
]

export const questions: Question[] = [
  ...basicsQuestions,
  ...selfQuestions,
  ...onlyFor('couple', coupleQuestions),
  ...onlyFor('early', earlyQuestions),
]

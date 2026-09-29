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
export const QUESTIONNAIRE_VERSION = '2026.09.3'

export const categories: Category[] = [
  {
    id: 'basics',
    label: 'Таны тухай',
    description: 'Таны болон та хоёрын харилцааны талаар бага зэрэг мэдээлэл.',
    intro: {
      title: 'Эхлээд таныг бага зэрэг танъя',
      text: 'Хэдэн энгийн асуултаар таныг болон та хоёрын харилцааг ойлгоё. Зөв, буруу хариулт гэж байхгүй — хамгийн үнэн санагдсанаа сонгоорой.',
    },
    // Context only, not scored — the same gentle line whatever the answers.
    outro: {
      high: 'Баярлалаа. Одоо та хоёрын түүхийг бага зэрэг ойлголоо.',
      mid: 'Баярлалаа. Одоо та хоёрын түүхийг бага зэрэг ойлголоо.',
      low: 'Баярлалаа. Одоо та хоёрын түүхийг бага зэрэг ойлголоо.',
    },
  },
  {
    id: 'communication',
    label: 'Харилцан яриа',
    description: 'Хэрхэн ярилцаж, сонсож, холбогддог вэ.',
    intro: {
      title: 'Одоо та хоёрын харилцан ярианы тухай',
      text: 'Хэн нь түрүүлж холбогддог, таныг сонсдог эсэх, сэтгэлээ хэр нээлттэй хуваалцаж чаддаг тухай асууя.',
    },
    outro: {
      high: 'Та хоёрын хооронд яриа ихэнхдээ амархан урсдаг бололтой. Энэ бол маш сайхан суурь.',
      mid: 'Яриа тань заримдаа амархан, заримдаа хүндрэлтэй байдаг бололтой. Энэ их түгээмэл зүйл.',
      low: 'Сэтгэлээ хуваалцах нь танд амаргүй байгааг мэдэрлээ. Энэ хэсгийг тайландаа анхааралтай тайлбарлана.',
    },
  },
  {
    id: 'affection',
    label: 'Энхрийлэл',
    description: 'Дулаан сэтгэл, ойр дотно байдал, хүсэгдэх мэдрэмж.',
    intro: {
      title: 'Энхрийлэл ба ойр дотно байдал',
      text: 'Өдөр тутмын дулаан харьцаа, хүсэгдэж буй мэдрэмж, хамтдаа байхдаа юу мэдэрдэг тухай.',
    },
    outro: {
      high: 'Та хоёрын дунд дулаан сэтгэл байгаа нь мэдрэгдэж байна.',
      mid: 'Дулаан мөчүүд байгаа ч, заримдаа илүү ихийг хүсдэг бололтой. Энэ бол хэвийн хүсэл.',
      low: 'Ойр дотно байдлыг санагалзаж байгаа нь мэдрэгдлээ. Та үүнийг хүсэх бүрэн эрхтэй.',
    },
  },
  {
    id: 'effort',
    label: 'Хичээл зүтгэл',
    description: 'Хэн санаачилж, төлөвлөж, асуудлыг засдаг вэ.',
    intro: {
      title: 'Хэн хэр их хичээдэг вэ?',
      text: 'Төлөвлөх, санаачлах, асуудлыг засах үүрэг та хоёрын хооронд хэрхэн хуваагддаг тухай.',
    },
    outro: {
      high: 'Та хоёр харилцаандаа хамтдаа хичээдэг бололтой. Энэ их үнэ цэнтэй.',
      mid: 'Ачаа үргэлж тэнцүү хуваагддаггүй бололтой. Ихэнх хосуудад ийм үе байдаг.',
      low: 'Их ачааг ганцаараа үүрч яваа юм шиг санагдаж байгааг ойлголоо. Энэ хүнийг их ядраадаг.',
    },
  },
  {
    id: 'trust',
    label: 'Итгэлцэл',
    description: 'Аюулгүй мэдрэмж, санаа зовнил, итгэл.',
    intro: {
      title: 'Итгэлцэл',
      text: 'Та хамтрагчдаа хэр тайван, итгэлтэй байдаг тухай. Энд аль болох шударгаар хариулаарай — энэ бол зөвхөн таны төлөө.',
    },
    outro: {
      high: 'Та хамтрагчдаа тайван итгэдэг нь харагдаж байна. Энэ бол том давуу тал.',
      mid: 'Итгэл байгаа ч, заримдаа санаа зовох үе гардаг бололтой. Үүнийг хамтдаа ойлгоё.',
      low: 'Сэтгэл тань тайван биш байгааг мэдэрлээ. Үүнийг болгоомжтой, анхааралтай харна.',
    },
  },
  {
    id: 'conflict',
    label: 'Маргаан',
    description: 'Санал зөрөлдөөн хэрхэн өрнөж, шийдэгддэг вэ.',
    intro: {
      title: 'Маргаан ба эвлэрэл',
      text: 'Санал зөрөлдөөн бүх харилцаанд байдаг. Чухал нь та хоёр түүнийг хэрхэн даван туулдаг вэ гэдэг.',
    },
    outro: {
      high: 'Та хоёр санал зөрөлдөөнөө сайн даван туулдаг бололтой.',
      mid: 'Маргаан заримдаа бүрэн шийдэгддэггүй бололтой. Энэ бол засаж болох зүйл.',
      low: 'Маргаан танд хүнд тусдаг нь мэдрэгдлээ. Та хүндэтгэл хүлээх эрхтэй.',
    },
  },
  {
    id: 'independence',
    label: 'Бие даасан байдал',
    description: 'Харилцаан доторх таны өөрийн амьдрал.',
    intro: {
      title: 'Одоо таны өөрийн тухай',
      text: 'Харилцаанаас гадуурх таны амьдрал, найз нөхөд, сэтгэл санааны тэнцвэрийн тухай хэдэн асуулт.',
    },
    outro: {
      high: 'Та өөрийгөө хадгалж чаддаг нь сайхан байна.',
      mid: 'Заримдаа сэтгэл санаа тань хамтрагчаас их хамаардаг бололтой. Энэ их түгээмэл.',
      low: 'Сэтгэл тань их зүйлийг дааж яваа юм шиг байна. Өөртөө ч анхаарал хэрэгтэй.',
    },
  },
  {
    id: 'future',
    label: 'Ирээдүй',
    description: 'Та хоёр энэ харилцааг хаашаа чиглэж байна гэж хардаг вэ.',
    intro: {
      title: 'Сүүлийн хэсэг: ирээдүй',
      text: 'Бараг дууслаа. Та хоёр хаашаа явж байгаа, ирээдүйгээ хэрхэн төсөөлдөг тухай.',
    },
    outro: {
      high: 'Та хоёр нэг зүг рүү харж байгаа бололтой.',
      mid: 'Ирээдүйн талаар тодорхойгүй зүйлс байгаа бололтой.',
      low: 'Ирээдүйн талаар эргэлзээ байгааг ойлголоо.',
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

/** Attach caring replies to specific options (shown briefly after the answer is chosen). */
function withReplies(options: AnswerOption[], replies: Record<string, string>): AnswerOption[] {
  return options.map((o) => (replies[o.value] ? { ...o, reply: replies[o.value] } : o))
}

// ---------------------------------------------------------------------------
// Questions — shown in array order.
// ---------------------------------------------------------------------------

export const questions: Question[] = [
  // ТАНЫ ТУХАЙ ------------------------------------------------------------------
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
  {
    id: 'basics_type',
    category: 'basics',
    text: 'Та хоёрын харилцаа одоо ямар шатандаа байна вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'stage'],
    options: [
      { value: 'talking', label: 'Зүгээр чатлаж, танилцаж байгаа' },
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
    id: 'basics_frequency',
    category: 'basics',
    text: 'Одоогоор та хоёр хэр олон уулздаг вэ?',
    type: 'single_choice',
    analysisTags: ['context', 'time_together'],
    // Couples who share a home get the quality-time question below instead.
    showIf: { question: 'basics_type', notIn: ['living_together', 'married'] },
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
    text: 'Хамтдаа чанартай цаг хэр их өнгөрөөдөг вэ?',
    helper: 'Утас, ажил, гэрийн ажилгүйгээр — зөвхөн та хоёр.',
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
    options: withReplies(positiveFrequency('fear_of_reaction'), {
      never: 'Гомдлоо хэлэхээс эмээх нь ойлгомжтой. Энд та чөлөөтэй байж болно.',
      rarely: 'Гомдлоо хэлэхээс эмээх нь ойлгомжтой. Энд та чөлөөтэй байж болно.',
    }),
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
    options: withReplies(negativeFrequency('attention_seeking'), {
      often: 'Ийм мэдрэмж хүнийг их ядраадаг. Та ганцаараа биш.',
      almost_always: 'Ийм мэдрэмж хүнийг их ядраадаг. Та ганцаараа биш.',
    }),
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
      {
        value: 'little_distant',
        label: 'Арай хөндийрсөн',
        score: 0.3,
        flag: 'drifting_apart',
        reply: 'Ойлголоо. Ийм өөрчлөлтийг олон хос мэдэрдэг бөгөөд үүнийг засах боломжтой.',
      },
      {
        value: 'much_distant',
        label: 'Нэлээд хөндийрсөн',
        score: 0,
        flag: 'drifting_apart',
        reply: 'Ойлголоо. Ийм өөрчлөлтийг олон хос мэдэрдэг бөгөөд үүнийг засах боломжтой.',
      },
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
    options: withReplies(positiveFrequency(), {
      often: 'Энэ бол ойр дотно харилцааны сайхан шинж.',
      almost_always: 'Энэ бол ойр дотно харилцааны сайхан шинж.',
    }),
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
    category: 'effort',
    text: 'Хэрвээ та нэг долоо хоног хичээхээ багасгавал юу болно гэж бодож байна?',
    type: 'single_choice',
    weight: 1.25,
    analysisTags: ['effort', 'reciprocity', 'security'],
    options: [
      { value: 'nothing', label: 'Бараг юу ч өөрчлөгдөхгүй', score: 0.8 },
      { value: 'partner_steps_up', label: 'Хамтрагч маань анзаарч, өөрөө хичээнэ', score: 1 },
      { value: 'distant', label: 'Бид мэдэгдэхүйц хөндийрнө', score: 0.3, flag: 'effort_imbalance' },
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
      { value: 'once_or_twice', label: 'Нэг хоёр удаа тохиолдсон', score: 0.4, flag: 'harmful_conflict', reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.' },
      { value: 'sometimes', label: 'Тийм, заримдаа', score: 0.1, flag: 'harmful_conflict', reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.' },
      { value: 'often', label: 'Тийм, байнга', score: 0, flag: 'harmful_conflict', reply: 'Хуваалцсанд баярлалаа. Хүн бүр хүндэтгэл хүлээх эрхтэй.' },
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
      { value: 'resolve', label: 'Бид ярилцаж, шийддэг', score: 1, reply: 'Маш сайн. Энэ бол эрүүл харилцааны нэг шинж.' },
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
      { value: 'very_happy', label: 'Маш баяртай байна', score: 1, reply: 'Сайхан байна. Энэ бол маш том давуу тал.' },
      { value: 'mostly_happy', label: 'Ихэнхдээ баяртай байна', score: 0.75 },
      { value: 'unsure', label: 'Эргэлзэж байна', score: 0.4 },
      { value: 'unhappy', label: 'Баярлахгүй', score: 0.15, flag: 'status_quo_unhappy', reply: 'Үнэнээ хэлсэнд баярлалаа. Өөрчлөлт хүсэх нь зүйн хэрэг.' },
      { value: 'would_not_want', label: 'Би ийм байхыг хүсэхгүй', score: 0, flag: 'status_quo_unhappy', reply: 'Үнэнээ хэлсэнд баярлалаа. Өөрчлөлт хүсэх нь зүйн хэрэг.' },
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

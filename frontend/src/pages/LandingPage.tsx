import { ArrowRight, Check, Clock, Heart, Lock, MessageCircleHeart, Quote, Sparkles, Sprout, UserX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LemonMark } from '../components/layout/LemonMark'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RetestButton } from '../components/ui/RetestButton'
import { audienceParam, checkPath } from '../data/track'
import type { Track } from '../data/types'
import { useAppConfig } from '../hooks/useAppConfig'
import { track } from '../lib/analytics'
import { cn, formatPrice } from '../lib/format'
import { storage } from '../lib/storage'

/**
 * One page, two audiences. Without ?for= it speaks to both and offers two doors;
 * with ?for=early / ?for=couple (from ads and shared cards) it speaks to one, so the
 * page matches the message people clicked on.
 */
type View = Track | 'both'

const HERO: Record<View, { before: string; highlight: string; after: string; text: string }> = {
  both: {
    before: 'Харилцаагаа ',
    highlight: 'өөр өнцгөөс',
    after: ' хараад үзээрэй',
    text: 'Дөнгөж танилцаж байгаа ч, олон жил хамт байгаа ч хамаагүй. Хэдэн асуултад хариулаад, та хоёрын хооронд яг юу болоод байгааг ойлгоорой.',
  },
  early: {
    before: 'Энэ харилцаа ',
    highlight: 'ирээдүйтэй',
    after: ' юу?',
    text: 'Тэр таныг үнэхээр сонирхож байна уу? Та хоёр адилхан зүйл хүсэж байна уу? Хэдэн асуултад хариулаад, бодит байдлыг нь харж аваарай.',
  },
  couple: {
    before: 'Харилцаагаа ',
    highlight: 'өөр өнцгөөс',
    after: ' хараад үзээрэй',
    text: 'Ганцаараа хичээгээд байгаа юм шиг санагдаж байна уу? Эсвэл зүгээр л бүх зүйл зүгээр байгаа эсэхийг мэдмээр байна уу? Хэдэн асуултад хариулаад, та хоёрын хооронд яг юу болоод байгааг ойлгоорой.',
  },
}

/** Thoughts people actually have — the visitor should recognise themselves in at least one. */
const THOUGHTS: Record<View, string[]> = {
  early: [
    'Тэр намайг үнэхээр сонирхож байна уу, эсвэл зүгээр л цаг нөхцөөж байна уу?',
    'Яагаад заримдаа гэнэт алга болчихдог юм бол?',
    'Би л үргэлж түрүүлж бичдэг юм шиг.',
    'Бид хоёр адилхан зүйл хүсэж байгаа болов уу?',
    'Би хэт их бодоод байна уу, эсвэл үнэхээр ямар нэг юм болоод байна уу?',
    'Үргэлжлүүлэх үү, эсвэл дэмий цаг алдаж байна уу?',
  ],
  couple: [
    'Би л үргэлж түрүүлж бичдэг юм шиг.',
    'Маргалддаггүй ч, бие биенээсээ холдчихсон юм шиг санагддаг.',
    'Тэр намайг ирээдүйдээ хардаг болов уу?',
    'Би хэт их зүйл хүсээд байна уу?',
    'Нэг л юм дутуу санагдаад байх юм.',
    'Бидний харилцаа ер нь зүгээр байгаа юу?',
  ],
  both: [
    'Тэр намайг үнэхээр сонирхож байна уу, эсвэл зүгээр л цаг нөхцөөж байна уу?',
    'Яагаад заримдаа гэнэт алга болчихдог юм бол?',
    'Бид хоёр адилхан зүйл хүсэж байгаа болов уу?',
    'Би л үргэлж түрүүлж бичдэг юм шиг.',
    'Маргалддаггүй ч, бие биенээсээ холдчихсон юм шиг санагддаг.',
    'Бидний харилцаа ер нь зүгээр байгаа юу?',
  ],
}

const STEPS = [
  { title: 'Асуултад хариулна', text: 'Нэг удаад нэг асуулт. Бодоод, үнэнээ хариулаарай. 7 минут орчим л болно.' },
  { title: 'Товч дүгнэлтээ үнэгүй харна', text: 'Давуу тал, анхаарах зүйлсээ шууд харна. Үүнд төлбөр шаардлагагүй.' },
  { title: 'Бүтэн тайлангаа нээнэ', text: 'Юу болоод байгаа, яагаад ингэж байгаа, цаашаа юу хийж болохыг энгийн үгээр тайлбарлана.' },
]

const REPORT_INCLUDES: Record<View, string[]> = {
  early: [
    'Энэ харилцаа ирээдүйтэй юу гэдэгт шударга хариулт',
    'Сайн ба анхаарах дохионууд',
    'Сонирхол, тогтвортой байдал, зорилго зэрэг 7 чиглэлийн тайлбар',
    'Түүнд хэлж, асууж болох үгс',
    'Ирэх 7 хоногт хийх 3 алхам',
  ],
  couple: [
    'Та хоёрын харилцааны гол хэв маяг',
    'Харилцан яриа, итгэлцэл, энхрийлэл зэрэг 7 чиглэлийн тайлбар',
    'Эрүүл харилцаа ямар байдгийг',
    'Хамтрагчдаа хэлж болох үгс',
    'Ирэх 7 хоногт хийх 3 алхам',
  ],
  both: [
    'Та хоёрын хооронд яг юу болоод байгаа, яагаад',
    'Танилцаж байгаа бол: ирээдүйтэй эсэх талаар шударга дүгнэлт',
    '7 чиглэл тус бүрийн тайлбар',
    'Нөгөө хүндээ хэлж болох үгс',
    'Ирэх 7 хоногт хийх 3 алхам',
  ],
}

const FAQ = [
  {
    q: 'Нөгөө хүн маань мэдчих үү?',
    a: 'Үгүй. Та өөрөө хэлэхгүй л бол хэн ч мэдэхгүй. Нэр, утас асуухгүй, бүртгэл хэрэггүй. Хариултууд тань нууцлагдаж хадгалагдана.',
  },
  {
    q: 'Бид дөнгөж танилцаж байгаа. Болох уу?',
    a: 'Болно. Чатлаж, танилцаж байгаа хүмүүст зориулсан тусдаа асуулт, тусдаа тайлан бий. “Энэ харилцаа ирээдүйтэй юу?” гэдэгт шударгаар хариулна.',
  },
  {
    q: 'Бүртгүүлэх хэрэгтэй юу?',
    a: 'Үгүй, шууд эхлээд л болно. Тайлан тань тусгай холбоосоор нээгддэг тул тэр холбоосоо хадгалаад аваарай.',
  },
  {
    q: 'Оноо, хувь гаргадаг уу?',
    a: 'Үгүй. Харилцааг тоогоор хэмжих боломжгүй. Тайлан тань тоо биш, тайлбар, зөвлөгөөнөөс бүрдэнэ.',
  },
  {
    q: 'Хэрхэн төлөх вэ?',
    a: 'Асуултууд болон товч дүгнэлт үнэгүй. Бүтэн тайланг QPay-ээр төлнө: банкны аппаараа QR код уншуулахад л болно. Төлбөр орсноос хойш нэг минут хүрэхгүй хугацаанд тайлан тань бэлэн болно.',
  },
  {
    q: 'Хариултаа устгаж болох уу?',
    a: 'Болно. Тайлангийн доод хэсэгт «Тайлангаа устгах» товч бий. Дарахад бүх зүйл бүрмөсөн устна.',
  },
]

export function LandingPage() {
  const { price, currency } = useAppConfig()
  const [params] = useSearchParams()
  const audience = audienceParam(params.get('for'))
  const view: View = audience ?? 'both'
  useEffect(() => track({ name: 'landing_viewed' }), [])

  const inProgress = storage.loadAssessment() !== null
  const priceText = formatPrice(price, currency)
  const hero = HERO[view]

  // Sticky phone CTA: shown once the hero's buttons scroll away, hidden again at the final CTA.
  const heroCta = useRef<HTMLDivElement>(null)
  const finalCta = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState({ hero: true, final: false })
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      setVisible((v) => {
        const next = { ...v }
        for (const e of entries) {
          if (e.target === heroCta.current) next.hero = e.isIntersecting
          if (e.target === finalCta.current) next.final = e.isIntersecting
        }
        return next
      })
    })
    if (heroCta.current) observer.observe(heroCta.current)
    if (finalCta.current) observer.observe(finalCta.current)
    return () => observer.disconnect()
  }, [])
  const showSticky = !visible.hero && !visible.final

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 glow-warm" />
        <div className="relative mx-auto max-w-5xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pr-4 pl-1.5 text-sm text-ink-soft backdrop-blur">
              <LemonMark className="size-6" />
              Lemony · харилцааны шалгалт
            </p>
            <h1 className="font-display text-[2.1rem] leading-[1.12] font-bold text-balance sm:text-6xl">
              {hero.before}
              <span className="text-gradient">{hero.highlight}</span>
              {hero.after}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">{hero.text}</p>

            <div ref={heroCta} className="mt-10 flex flex-col items-center gap-4">
              {inProgress ? (
                <>
                  <ButtonLink to="/complete" size="lg" className="w-full max-w-xs sm:w-auto">
                    Үргэлжлүүлэх <ArrowRight className="size-4" />
                  </ButtonLink>
                  <RetestButton variant="ghost" label="Шинээр шалгах" />
                </>
              ) : audience ? (
                <>
                  <ButtonLink to={checkPath(audience)} size="lg" className="w-full max-w-xs sm:w-auto">
                    Эхлэх <ArrowRight className="size-4" />
                  </ButtonLink>
                  <Link
                    to={`/?for=${audience === 'early' ? 'couple' : 'early'}`}
                    className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                  >
                    {audience === 'early' ? 'Үерхэж эсвэл гэр бүлтэй юу? Энд дарна уу' : 'Дөнгөж танилцаж байгаа юу? Энд дарна уу'}
                  </Link>
                </>
              ) : (
                <AudienceDoors />
              )}

              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                <li className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden /> 7 минут
                </li>
                <li className="flex items-center gap-1.5">
                  <UserX className="size-4" aria-hidden /> Бүртгэл хэрэггүй
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="size-4" aria-hidden /> Хэн ч харахгүй
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Recognisable thoughts */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">Эдгээр бодол танд танил уу?</h2>
        </div>
        <ul className="mt-10 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THOUGHTS[view].map((thought) => (
            <li
              key={thought}
              className="flex items-start gap-3 rounded-3xl border border-line bg-paper p-5 backdrop-blur transition hover:border-white/20"
            >
              <Quote className="mt-0.5 size-5 shrink-0 text-lemon" aria-hidden />
              <p className="text-base leading-relaxed font-medium">{thought}</p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-12 max-w-xl text-center text-lg leading-relaxed text-ink-soft">
          Ийм бодол олон хүнд төрдөг, та ганцаараа биш. Цаана нь юу байгааг ойлгочихвол цаашаа яахаа мэдэхэд амар
          болно.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="mb-10 text-center font-display text-3xl font-bold sm:text-4xl">Яаж ажилладаг вэ?</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="grid size-10 place-items-center rounded-full bg-accent font-display text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Report preview */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">Тайлан ийм харагдана</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Хэнийг ч буруутгахгүй, хэнд ч муу нэр зүүхгүй. Юу болоод байгааг, яагаад ингэж байгааг, цаашаа юу хийж
              болохыг энгийн, ойлгомжтой үгээр тайлбарлана.
            </p>
            <ul className="mt-6 space-y-3">
              {REPORT_INCLUDES[view].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent">
                    <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {view === 'early' ? <EarlyExcerpts /> : <CoupleExcerpts />}
        </div>
      </section>

      {/* FAQ — privacy is the first answer (and a hero badge), so it isn't repeated as its own section. */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="mb-8 text-center font-display text-3xl font-bold">Асуулт байна уу?</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-3xl border border-line bg-paper px-6 py-5 backdrop-blur">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sand text-ink-soft transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div ref={finalCta} className="mx-auto max-w-4xl rounded-4xl surface-hero px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">Хэдхэн минут л болно</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">Асуултууд үнэгүй. Бүтэн тайлан {priceText}.</p>
          <div className="mt-8 flex justify-center">
            {inProgress ? (
              <ButtonLink to="/complete" size="lg">
                Үргэлжлүүлэх <ArrowRight className="size-4" />
              </ButtonLink>
            ) : audience ? (
              <ButtonLink to={checkPath(audience)} size="lg">
                Эхлэх <ArrowRight className="size-4" />
              </ButtonLink>
            ) : (
              <AudienceDoors />
            )}
          </div>
        </div>
      </section>

      {/* Phones only: a start button that stays in reach while reading. */}
      <div
        aria-hidden={!showSticky}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 sm:hidden',
          showSticky ? 'translate-y-0' : 'pointer-events-none translate-y-full',
        )}
      >
        <ButtonLink
          to={inProgress ? '/complete' : checkPath(audience)}
          size="lg"
          className="w-full"
          tabIndex={showSticky ? 0 : -1}
        >
          {inProgress ? 'Үргэлжлүүлэх' : 'Үнэгүй эхлэх'} <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </div>
  )
}

/** Two doors: each goes straight to its own questions. */
function AudienceDoors() {
  const doors: { audience: Track; title: string; text: string }[] = [
    { audience: 'early', title: 'Чатлаж, танилцаж байгаа', text: 'Энэ харилцаа ирээдүйтэй юу?' },
    { audience: 'couple', title: 'Үерхэж эсвэл гэр бүлтэй', text: 'Бидний харилцаа зүгээр үү?' },
  ]
  return (
    <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
      {doors.map((door, i) => (
        <Link
          key={door.audience}
          to={checkPath(door.audience)}
          className={cn(
            'group flex items-center justify-between gap-3 rounded-3xl px-5 py-4 text-left transition hover:-translate-y-0.5',
            i === 0 ? 'bg-accent text-white shadow-glow' : 'border border-line bg-paper hover:border-white/25',
          )}
        >
          <span>
            <span className="block font-semibold">{door.title}</span>
            <span className={cn('mt-0.5 block text-sm', i === 0 ? 'text-white/80' : 'text-ink-muted')}>{door.text}</span>
          </span>
          <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ))}
    </div>
  )
}

/** Excerpts in the real report's style — early stage. */
function EarlyExcerpts() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="rounded-4xl border border-line bg-paper p-6 shadow-lift">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Энэ харилцаа ирээдүйтэй юу?</p>
        <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-clay-soft px-3 py-1 text-sm font-semibold text-clay-dark">
          <span className="flex gap-0.5">
            <span className="size-2 rounded-full bg-clay" />
            <span className="size-2 rounded-full bg-clay" />
            <span className="size-2 rounded-full bg-clay/25" />
          </span>
          Одоохондоо тодорхойгүй
        </span>
        <p className="mt-3 text-[17px] leading-relaxed">
          Сонирхол хоёр талаас байгаа ч, та хоёр юу хүсэж байгаагаа хараахан ярилцаагүй байна. Энэ талаар ярилцчихвол бүх
          зүйл илүү тодорхой болно.
        </p>
      </div>
      <div className="ml-4 rounded-3xl border border-teal-300/15 bg-sage-soft p-5 sm:ml-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sage">
          <Sparkles className="size-4" /> Сайн дохио
        </p>
        <p className="mt-2 text-[15px] leading-relaxed">Тэр таны хэлсэн жижиг зүйлсийг санаж, өөрөө асуулт асуудаг.</p>
      </div>
      <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-pink-500/8 p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-clay-dark">
          <MessageCircleHeart className="size-4" /> Ингэж хэлээд үзээрэй
        </p>
        <p className="mt-2 text-[17px] leading-relaxed font-medium">
          “Чамтай ярих надад их таатай байна. Би тогтвортой харилцаа хүсэж байна. Чи ямар харилцаа хүсэж байна?”
        </p>
      </div>
    </div>
  )
}

/** Excerpts in the real report's style — couples. */
function CoupleExcerpts() {
  return (
    <div aria-hidden className="space-y-3">
      <div className="rounded-4xl border border-pink-300/20 bg-gradient-to-br from-pink-500/12 via-fuchsia-500/8 to-violet-500/10 p-6">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-dusk">
          <Heart className="size-4" /> Танд хэлэх үг
        </p>
        <p className="mt-3 text-[17px] leading-relaxed">
          Харилцаагаа авч үлдэх гэж их хичээж байгаа тань харагдаж байна. Гэхдээ та ч бас анхаарал, халамж хүртэх хүн
          шүү.
        </p>
      </div>
      <div className="ml-4 rounded-3xl border border-teal-300/15 bg-sage-soft p-5 sm:ml-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-sage">
          <Sprout className="size-4" /> Эрүүл харилцаанд ийм байдаг
        </p>
        <p className="mt-2 text-[15px] leading-relaxed">
          Хэн нь олон бичих нь чухал биш. Хоёулаа «чи надад чухал» гэдгээ мэдрүүлж чаддаг байх нь чухал.
        </p>
      </div>
      <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-pink-500/8 p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-clay-dark">
          <MessageCircleHeart className="size-4" /> Ингэж хэлээд үзээрэй
        </p>
        <p className="mt-2 text-[17px] leading-relaxed font-medium">
          “Чамаас мессеж ирэхэд би үнэхээр их баярладаг. Заримдаа чи ч гэсэн түрүүлж бичээсэй гэж хүсдэг юм.”
        </p>
      </div>
    </div>
  )
}

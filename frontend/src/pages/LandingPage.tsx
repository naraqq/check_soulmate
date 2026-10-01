import { ArrowRight, Check, Clock, Heart, Lock, MessageCircleHeart, Quote, Sparkles, Sprout, UserX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { LemonMark } from '../components/layout/LemonMark'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { RetestButton } from '../components/ui/RetestButton'
import { audienceParam } from '../data/track'
import type { Track } from '../data/types'
import { track } from '../lib/analytics'
import { cn } from '../lib/format'
import { storage } from '../lib/storage'

/** Ads can tailor examples; every visitor starts with the same stage question. */
type View = Track | 'both'

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
  { title: 'Товч дүгнэлтээ харна', text: 'Хариултаас тань харагдах давуу тал, анхаарах зүйлсийг нэгтгэнэ.' },
  { title: 'Дараагийн алхмаа олно', text: 'Дэлгэрэнгүй тайлангаас ярилцах сэдэв, хэлж болох үгс, туршиж болох алхмуудыг харна.' },
]

const REPORT_INCLUDES: Record<View, string[]> = {
  early: [
    'Одоогоор харагдаж буй сайн болон эргэлзээтэй талууд',
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
    'Таны хариултаас харагдаж буй харилцааны хэв маяг',
    'Харилцааныхаа шатанд тохирсон тайлбар',
    '7 чиглэл тус бүрийн тайлбар',
    'Нөгөө хүндээ хэлж болох үгс',
    'Ирэх 7 хоногт хийх 3 алхам',
  ],
}

const FAQ = [
  {
    q: 'Нөгөө хүн маань мэдчих үү?',
    a: 'Нөгөө хүнд тань мэдэгдэл илгээхгүй. Нэр, утас асуухгүй, бүртгэл хэрэггүй. Та өөрөө хүсвэл тайлангийн сонгосон хэсгийг тусдаа холбоосоор хуваалцаж болно.',
  },
  {
    q: 'Бид дөнгөж танилцаж байгаа. Болох уу?',
    a: 'Болно. Чатлаж, танилцаж байгаа хүмүүст зориулсан тусдаа асуулт, тусдаа тайлан бий. Таны хариултаас харагдах зүйлс болон одоогоор тодорхойгүй байгаа талыг ялгаж тайлбарлана.',
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
    q: 'Хариултаа устгаж болох уу?',
    a: 'Болно. Тайлангийн доод хэсэгт «Тайлангаа устгах» товч бий. Дарахад бүх зүйл бүрмөсөн устна.',
  },
]

export function LandingPage() {
  const [params] = useSearchParams()
  const audience = audienceParam(params.get('for'))
  const view: View = audience ?? 'both'
  useEffect(() => track({ name: 'landing_viewed' }), [])

  const inProgress = storage.loadAssessment() !== null

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
        <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-10 sm:px-6 sm:pt-20 sm:pb-16">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-paper py-1.5 pr-4 pl-1.5 text-sm text-ink-soft backdrop-blur">
              <LemonMark className="size-6" />
              Lemony · Хайрын тест
            </p>
            <h1 className="font-display text-[2.1rem] leading-[1.12] font-bold text-balance sm:text-6xl">
              Харилцаагаа илүү ойлгож,<br />
              <span className="text-gradient">сайжруулах арга замаа олоорой.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">Асуултад хариулж, харилцааныхаа давуу тал, анхаарах зүйлс болон та хоёрт тохирох зөвлөмжийг аваарай.</p>

            <div ref={heroCta} className="mt-7 flex flex-col items-center gap-4">
              {inProgress ? (
                <>
                  <ButtonLink to="/complete" size="lg" className="w-full max-w-xs sm:w-auto">
                    Үргэлжлүүлэх <ArrowRight className="size-4" />
                  </ButtonLink>
                  <RetestButton variant="ghost" label="Шинээр шалгах" />
                </>
              ) : (
                <ButtonLink to="/check" size="lg" className="w-full max-w-sm sm:w-auto">
                  Тест эхлүүлэх <ArrowRight className="size-4" />
                </ButtonLink>
              )}

              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                <li className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden /> ~7 минут
                </li>
                <li className="flex items-center gap-1.5">
                  <UserX className="size-4" aria-hidden /> Бүртгэл хэрэггүй
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="size-4" aria-hidden /> Хариулт тань нууц
                </li>
              </ul>
            </div>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink-muted">
              Чатлаж, болзож байгаа ч, олон жил хамт байгаа ч болно. Асуултууд харилцааны тань шатанд тохирно.
            </p>
          </div>
        </div>
      </section>

      {/* Report preview */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">Тайлан ийм харагдана</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Нөгөө хүний бодлыг таахгүй. Таны хариултад тулгуурлан юу ажиглагдаж байна, юу тодорхойгүй байна,
              цааш юу хийж болохыг тайлбарлана.
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
          <div>
            <p className="mb-3 text-sm font-semibold text-ink-muted">Жишээ тайлан · таны хувийн дүгнэлт биш</p>
            {view === 'early' ? <EarlyExcerpts /> : <CoupleExcerpts />}
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
        <aside className="mx-auto mt-8 max-w-3xl rounded-3xl border border-line bg-paper p-6 text-center sm:p-8" aria-labelledby="test-purpose">
          <h3 id="test-purpose" className="font-semibold">Энэ тестийн зорилго</h3>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Энэхүү тест нь сэтгэл зүйн зөвлөгөө, олон жилийн бодит ярианууд дээр үндэслэн харилцаагаа эрүүлээр харахад тань туслах зорилгоор хийгдсэн.
          </p>
        </aside>
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
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">Өөрт чухал зүйлсээ ойлгох эхний алхмаа хийгээрэй.</p>
          <div className="mt-8 flex justify-center">
            {inProgress ? (
              <ButtonLink to="/complete" size="lg">
                Үргэлжлүүлэх <ArrowRight className="size-4" />
              </ButtonLink>
            ) : (
              <ButtonLink to="/check" size="lg">
                Тест эхлүүлэх <ArrowRight className="size-4" />
              </ButtonLink>
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
          to={inProgress ? '/complete' : '/check'}
          size="lg"
          className="w-full"
          tabIndex={showSticky ? 0 : -1}
        >
          {inProgress ? 'Үргэлжлүүлэх' : 'Тест эхлүүлэх'} <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </div>
  )
}

/** Excerpts in the real report's style — early stage. */
function EarlyExcerpts() {
  return (
    <div className="space-y-3">
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
    <div className="space-y-3">
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

import { ArrowRight, Check, Clock, Heart, Lock, MessageCircleHeart, Quote, Sprout, UserX } from 'lucide-react'
import { useEffect } from 'react'
import { LemonMark } from '../components/layout/LemonMark'
import { ButtonLink } from '../components/ui/Button'
import { RetestButton } from '../components/ui/RetestButton'
import { Card } from '../components/ui/Card'
import { useAppConfig } from '../hooks/useAppConfig'
import { track } from '../lib/analytics'
import { formatPrice } from '../lib/format'
import { storage } from '../lib/storage'

/** Thoughts people actually have — the visitor should recognise themselves in at least one. */
const THOUGHTS = [
  'Би л үргэлж түрүүлж бичдэг юм шиг.',
  'Маргалддаггүй ч, хол болчихсон юм шиг санагддаг.',
  'Тэр намайг ирээдүйдээ хардаг болов уу?',
  'Би хэт их зүйл хүсээд байна уу?',
  'Нэг л юм дутуу санагдаад байх юм.',
  'Бид зөв замаар явж байгаа юу?',
]

const STEPS = [
  { title: 'Асуултад хариулна', text: 'Нэг удаад нэг асуулт. Бодоод, үнэнээ хариулаарай. 7 минут орчим болно.' },
  { title: 'Товч дүгнэлтээ үнэгүй харна', text: 'Та хоёрын давуу тал, анхаарах зүйлсийг шууд харуулна.' },
  { title: 'Бүтэн тайлангаа нээнэ', text: 'Юу болоод байгаа, яагаад, цаашаа юу хийж болохыг энгийн үгээр тайлбарлана.' },
]

const REPORT_INCLUDES = [
  'Та хоёрын харилцааны гол хэв маяг',
  'Харилцан яриа, итгэлцэл, энхрийлэл зэрэг 7 чиглэлийн тайлбар',
  'Эрүүл харилцаанд ямар байдаг вэ',
  'Хамтрагчдаа хэлж болох үгс',
  'Ирэх 7 хоногт хийх 3 алхам',
]

const FAQ = [
  {
    q: 'Хамтрагч маань мэдэх үү?',
    a: 'Үгүй. Та өөрөө хэлэхгүй л бол хэн ч мэдэхгүй. Хариултууд тань нууцлагдаж хадгалагдана.',
  },
  {
    q: 'Бүртгүүлэх хэрэгтэй юу?',
    a: 'Үгүй, шууд эхлээд л болно. Тайлан тань тусгай холбоосоор нээгддэг тул тэр холбоосоо хадгалаад аваарай.',
  },
  {
    q: 'Бид дөнгөж танилцаж байгаа. Болох уу?',
    a: 'Болно. Чатлаж байгаа, үерхэж байгаа, гэрлэсэн гээд аль ч шатанд тохирно. Асуулт, тайлан хоёр та хоёрын нөхцөлд тааруулж өөрчлөгддөг.',
  },
  {
    q: 'Оноо, хувь гаргадаг уу?',
    a: 'Үгүй. Харилцааг тоогоор хэмжих боломжгүй. Тайлан тань тоо биш, тайлбар ба зөвлөгөө.',
  },
  {
    q: 'Хэрхэн төлөх вэ?',
    a: 'QPay-ээр. Банкны аппаараа QR код уншуулаад л болно. Төлбөр орсны дараа нэг минут хүрэхгүй хугацаанд тайлан тань бэлэн болно.',
  },
  {
    q: 'Хариултаа устгаж болох уу?',
    a: 'Болно. Тайлангийн доод хэсэгт «Тайлангаа устгах» товч бий. Дарахад бүх зүйл бүрмөсөн устна.',
  },
]

export function LandingPage() {
  const { price, currency } = useAppConfig()
  useEffect(() => track({ name: 'landing_viewed' }), [])
  const inProgress = storage.loadAssessment() !== null
  const primaryTo = inProgress ? '/complete' : '/check'
  const primaryLabel = inProgress ? 'Үргэлжлүүлэх' : 'Эхлэх'

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
              Харилцаагаа <span className="text-gradient">гаднаас нь</span> хараад үзээрэй
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              Ганцаараа хичээж байгаа юм шиг санагдаж байна уу? Эсвэл зүгээр л зөв замаар явж байгаа эсэхээ мэдмээр байна
              уу? Хэдэн асуултад хариулаад, та хоёрын хооронд юу болоод байгааг ойлгоорой.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <ButtonLink to={primaryTo} size="lg" className="w-full max-w-xs sm:w-auto">
                {primaryLabel} <ArrowRight className="size-4" />
              </ButtonLink>
              {/* Returning visitor with a previous check: let them start a new one. */}
              {inProgress && <RetestButton variant="ghost" label="Шинээр шалгах" />}
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
          {THOUGHTS.map((thought) => (
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
          Ийм бодол олон хүнд төрдөг. Энэ нь харилцаа тань муу гэсэн үг биш. Харин цаана нь юу байгааг ойлгох нь дараагийн
          алхмаа олоход тусална.
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
            <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">Тайлан тань ийм байна</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Хэн нэгнийг буруутгах, шошго наах зүйл байхгүй. Та хоёрын хооронд юу болоод байгааг, яагаад ингэж байгааг,
              цаашаа юу хийж болохыг ойлгомжтойгоор тайлбарлана.
            </p>
            <ul className="mt-6 space-y-3">
              {REPORT_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px]">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent">
                    <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Excerpts in the real report's style */}
          <div aria-hidden className="space-y-3">
            <div className="rounded-4xl border border-pink-300/20 bg-gradient-to-br from-pink-500/12 via-fuchsia-500/8 to-violet-500/10 p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-dusk">
                <Heart className="size-4" /> Танд хэлэх үг
              </p>
              <p className="mt-3 text-[17px] leading-relaxed">
                Харилцаагаа хадгалах гэж гаргаж буй хичээл зүтгэл тань үнэхээр үнэ цэнтэй. Гэхдээ та ч бас халамжлуулах
                эрхтэй гэдгээ санаарай.
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
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Card className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-sage-soft">
            <Lock className="size-6 text-sage" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold">Хамтрагч тань ч, өөр хэн ч мэдэхгүй</h2>
            <p className="mt-2 text-ink-soft">
              Нэр, утасны дугаар асуухгүй, бүртгэл хэрэггүй. Хариултууд тань нууцлагдаж хадгалагдах бөгөөд хүссэн үедээ
              бүрмөсөн устгаж болно.
            </p>
          </div>
        </Card>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-4xl surface-hero px-6 py-14 text-center sm:px-12">
          <h2 className="font-display text-3xl font-bold text-balance sm:text-4xl">Хэдхэн минут л болно</h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
            Асуултууд үнэгүй. Бүтэн тайлан {formatPrice(price, currency)}.
          </p>
          <ButtonLink to={primaryTo} size="lg" className="mt-8">
            {primaryLabel} <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      </section>
    </div>
  )
}

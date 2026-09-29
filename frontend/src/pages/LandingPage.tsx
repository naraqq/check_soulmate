import {
  ArrowRight,
  Clock,
  Compass,
  Flame,
  Handshake,
  Lock,
  MessageCircle,
  Anchor,
  Repeat,
  ShieldCheck,
  UserX,
} from 'lucide-react'
import { ButtonLink } from '../components/ui/Button'
import { Card, Eyebrow } from '../components/ui/Card'
import { questions } from '../data/questions'
import { useAppConfig } from '../hooks/useAppConfig'
import { formatPrice } from '../lib/format'
import { storage } from '../lib/storage'

const AREAS = [
  { icon: MessageCircle, title: 'Харилцан яриа', text: 'Таныг сонсдог уу, хэн түрүүлж холбогддог вэ.' },
  { icon: ShieldCheck, title: 'Итгэлцэл', text: 'Аюулгүй мэдрэмж, санаа зовнил, итгэл.' },
  { icon: Handshake, title: 'Хүчин чармайлт', text: 'Хэн төлөвлөж, хэн асуудлыг засдаг вэ.' },
  { icon: Flame, title: 'Энхрийлэл', text: 'Ойр дотно байдал ба хүсэгдэх мэдрэмж.' },
  { icon: Repeat, title: 'Маргаан', text: 'Санал зөрөлдөөн хэрхэн өрнөж, шийдэгддэг вэ.' },
  { icon: Anchor, title: 'Бие даасан байдал', text: 'Харилцаан доторх таны өөрийн амьдрал.' },
  { icon: Compass, title: 'Ирээдүй', text: 'Та хоёрын хүлээлт хэр нийцдэг вэ.' },
]

const STEPS = [
  { title: 'Үнэнээр хариулна', text: `${questions.length} орчим богино асуулт, нэг нэгээр нь. Ойролцоогоор 7 минут.` },
  { title: 'Товч дүгнэлтээ харна', text: 'Давуу тал, судлах чиглэл, анхаарах хэв маягийг шууд харуулна.' },
  { title: 'Бүрэн тайлангаа нээнэ', text: 'Чиглэл бүрээр нарийвчилсан тайлбар, яриа эхлүүлэх санаанууд.' },
]

const FAQ = [
  {
    q: 'Энэ сэтгэл зүйн зөвлөгөө эсвэл эмчилгээ мөн үү?',
    a: 'Үгүй. Soulmate Check нь өөрийгөө эргэцүүлэн бодоход туслах хэрэгсэл юм. Тайлан нь зөвхөн таны хариултад үндэслэсэн мэдээллийн чанартай ажиглалт бөгөөд мэргэжлийн зөвлөгөө, оношилгоог орлохгүй.',
  },
  {
    q: 'Бүртгүүлэх шаардлагатай юу?',
    a: 'Үгүй. Нэвтрэх, бүртгүүлэх шаардлагагүй. Таны шалгалтыг зөвхөн санамсаргүй үүсгэсэн нууц холбоосоор таньдаг.',
  },
  {
    q: 'Миний хариултуудыг хэн харах вэ?',
    a: 'Таны хариултууд шифрлэгдсэн байдлаар хадгалагдана. Хамтрагч тань болон бусад хүн харахгүй. Төлбөр баталгаажсаны дараа тайлан үүсгэхийн тулд л хиймэл оюун ухааны үйлчилгээ рүү илгээгдэнэ.',
  },
  {
    q: 'Үр дүнг хэрхэн гаргадаг вэ?',
    a: 'Эхлээд таны хариултуудаас энгийн дүрэмд суурилсан товч дүгнэлт гаргана. Бүрэн тайланг хиймэл оюун ухаан таны хариултад тулгуурлан, болгоомжтой, шүүмжлэлгүй байдлаар бичдэг. Ямар нэг “хувь” эсвэл “оноо” өгөхгүй.',
  },
  {
    q: 'Төлбөрөө хэрхэн төлөх вэ?',
    a: 'QPay-ээр — банкны аппликейшнээрээ QR код уншуулах эсвэл банкны аппаа сонгож төлнө. Төлбөр баталгаажмагц тайлан тань нээгдэнэ.',
  },
  {
    q: 'Мэдээллээ устгаж болох уу?',
    a: 'Тийм. Тайлангийн хуудасны доод хэсэгт байрлах “Тайлангаа устгах” товчоор хариулт болон тайлангаа бүрмөсөн устгана.',
  },
]

export function LandingPage() {
  const { price, currency } = useAppConfig()
  const inProgress = storage.loadAssessment() !== null
  const primaryTo = inProgress ? '/complete' : '/check'

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 glow-warm" />
        <div className="relative mx-auto max-w-5xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <Eyebrow>Харилцааны хувийн шинжилгээ</Eyebrow>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.1] font-semibold text-balance sm:text-6xl">
              Таны харилцаа хэр <span className="text-gradient">эрүүл</span> санагддаг вэ?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              Харилцааныхаа талаарх хэдэн үнэн асуултад хариулж, харилцан яриа, итгэлцэл, хүчин чармайлт, энхрийлэл,
              маргааны хэв маяг болон ирээдүйн хүлээлтийн талаарх хувийн дүн шинжилгээгээ аваарай.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <ButtonLink to={primaryTo} size="lg" className="w-full max-w-xs sm:w-auto">
                {inProgress ? 'Үргэлжлүүлэх' : 'Харилцаагаа шалгах'} <ArrowRight className="size-4" />
              </ButtonLink>
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                <li className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden /> ~7 минут
                </li>
                <li className="flex items-center gap-1.5">
                  <UserX className="size-4" aria-hidden /> Бүртгэлгүй
                </li>
                <li className="flex items-center gap-1.5">
                  <Lock className="size-4" aria-hidden /> Нууцлалтай
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 text-center">
          <Eyebrow>Хэрхэн ажилладаг вэ</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Гурван энгийн алхам</h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full">
                <span className="grid size-10 place-items-center rounded-full bg-clay-soft font-display text-lg font-semibold text-clay-dark">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Areas */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <Eyebrow>Тайланд юу багтах вэ</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-balance sm:text-4xl">
              Таны харилцааг долоон чиглэлээр харна
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Хүчтэй талууд, анхаарах нь зүйтэй хэв маяг, хамтрагчтайгаа ярилцаж болох бодит сэдвүүд.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-line bg-paper p-5 backdrop-blur transition hover:border-white/20">
                <Icon className="size-5 text-clay" aria-hidden />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Report preview */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Eyebrow>Тайлангийн жишээ</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold text-balance sm:text-4xl">
              Шүүмжлэл биш — ойлголт
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Бид хэнийг ч оношлохгүй, “хорт харилцаа” гэх мэт шошго наахгүй. Та юу гэж хариулсан, энэ нь яагаад чухал
              байж болох, хамтрагчтайгаа юуны талаар ярилцаж болохыг л харуулна.
            </p>
          </div>
          <div aria-hidden className="relative">
            <div className="rounded-4xl surface-hero p-7 shadow-lift">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay-dark">Хүчин чармайлтын тэнцвэр</p>
              <p className="mt-4 text-lg leading-relaxed font-medium">
                “Та ихэнх яриаг өөрөө эхлүүлдэг, харин түрүүлж бичихгүй бол хамтрагч тань ховор холбогддог гэж хариулсан.
                Энэ нь хүчин чармайлт тэгш бус юм шиг мэдрэмж төрүүлж болох юм.”
              </p>
            </div>
            <div className="mt-3 ml-6 rounded-3xl border border-line bg-paper p-5 shadow-soft">
              <p className="text-xs font-semibold text-ink-muted">Яриа эхлүүлэх санаа</p>
              <p className="mt-2 text-lg font-medium">“Бид хоёр холбоо барих талаар ямар хүлээлттэй байдгаа ярилцаж болох уу?”</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-24">
        <Card className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-paper shadow-soft">
            <ShieldCheck className="size-7 text-sage" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold">Таны мэдээлэл таных хэвээр</h2>
            <p className="mt-2 text-ink-soft">
              Бүртгэл шаардлагагүй. Хариултууд шифрлэгдэж хадгалагдах бөгөөд та хүссэн үедээ бүрмөсөн устгах боломжтой.
              Бид таны хариултыг зар сурталчилгаа эсвэл аналитикт ашигладаггүй.
            </p>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 sm:pb-24">
        <h2 className="mb-8 text-center font-display text-3xl font-semibold">Түгээмэл асуултууд</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-3xl border border-line/80 bg-paper px-6 py-5 shadow-soft">
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
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-4xl surface-hero px-6 py-14 text-center sm:px-12">
          
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold text-balance sm:text-4xl">Өөрийн харилцаагаа илүү ойлгоорой</h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              Асуумж үнэгүй. Бүрэн, хувийн тайлан {formatPrice(price, currency)}.
            </p>
            <ButtonLink to={primaryTo} size="lg" className="mt-8">
              Харилцаагаа шалгах <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  )
}

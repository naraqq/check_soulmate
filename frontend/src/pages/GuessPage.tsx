import { ArrowRight, Check, Heart, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { ButtonLink } from '../components/ui/Button'
import { GUESS_CHOICES, loadGuess, saveGuess, styleFromGuessCode } from '../data/guessGame'
import { LOVE_STYLES, type LoveStyleId } from '../data/loveStyles'
import { track } from '../lib/analytics'
import { cn } from '../lib/format'

/**
 * A friend's side of "Миний хайрын хэв маягийг тааж чадах уу?": guess first, then the reveal,
 * then the natural next step — finding out their own. Friend-to-friend, so it speaks "чи".
 */
export function GuessPage() {
  const { code } = useParams()
  const real = styleFromGuessCode(code)
  const [guess, setGuess] = useState<LoveStyleId | null>(() => (code ? loadGuess(code) : null))

  useEffect(() => {
    document.title = 'Хайрын хэв маягийг тааж үз · Lemony'
    if (real) track({ name: 'guess_opened' })
  }, [real])

  if (!real || !code) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Энэ холбоос ажиллахгүй байна</h1>
        <p className="mt-3 text-ink-soft">Гэхдээ өөрийнхөө хайрын хэв маягийг мэдэж болно.</p>
        <ButtonLink to="/" size="lg" className="mt-8">
          Тест өгөх <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    )
  }

  function choose(id: LoveStyleId) {
    setGuess(id)
    saveGuess(code!, id)
    track({ name: 'guess_made', props: { detail: id === real!.id ? 'correct' : 'wrong' } })
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] glow-warm" />
      <div className="relative mx-auto max-w-xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        {guess === null ? <Ask onChoose={choose} /> : <Reveal guess={guess} realId={real.id} />}
      </div>
    </div>
  )
}

function Ask({ onChoose }: { onChoose: (id: LoveStyleId) => void }) {
  return (
    <div className="animate-fade-up">
      <p className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-dusk">
        Хайрын хэв маяг <Heart className="inline size-4 -translate-y-px" aria-hidden />
      </p>
      <h1 className="mt-3 text-center font-display text-3xl font-bold text-balance sm:text-4xl">Найзынхаа хайрын хэв маягийг тааж чадах уу?</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-ink-soft">Нэгийг нь сонго — дараа нь үнэн хариуг харна.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {GUESS_CHOICES.map((style) => (
          <li key={style.id}>
            <button
              type="button"
              onClick={() => onChoose(style.id)}
              className="h-full w-full rounded-3xl border border-line bg-paper p-5 text-left transition hover:-translate-y-0.5 hover:border-white/25"
            >
              <span className="block font-display text-lg font-semibold">{style.name}</span>
              {/* Traits, not the description: descriptions speak to their owner ("Та…"), this reader is a friend. */}
              <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{style.traits.join(' · ')}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Reveal({ guess, realId }: { guess: LoveStyleId; realId: LoveStyleId }) {
  const real = LOVE_STYLES[realId]
  const correct = guess === realId
  return (
    <div className="animate-fade-up">
      <div className="rounded-4xl border border-line bg-paper p-6 sm:p-8">
        <dl className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-soft">Чи:</dt>
            <dd className={cn('text-right font-semibold', correct ? 'text-sage' : 'text-ink')}>{LOVE_STYLES[guess].name} гэж таалаа</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
            <dt className="text-ink-soft">Бодит үр дүн:</dt>
            <dd className="text-right font-display text-xl font-bold">
              {real.name} <Heart className="inline size-4 -translate-y-px text-dusk" aria-hidden />
            </dd>
          </div>
        </dl>
        <p className={cn('mt-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium', correct ? 'bg-sage-soft text-sage' : 'bg-clay-soft text-clay-dark')}>
          {correct ? <Check className="size-4 shrink-0" aria-hidden /> : <X className="size-4 shrink-0" aria-hidden />}
          {correct ? 'Зөв таалаа! Чи найзаа үнэхээр сайн мэддэг юм байна.' : 'Тааж чадсангүй — гэхдээ одоо мэдлээ.'}
        </p>

        <div className="mt-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-clay-dark">
            <Sparkles className="size-3.5" aria-hidden /> {real.name}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {real.traits.map((t) => (
              <li key={t} className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-sm text-ink-soft">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-4xl surface-hero p-7 text-center shadow-lift sm:p-10">
        <h2 className="font-display text-2xl font-bold text-balance sm:text-3xl">Харин чиний хайрын хэв маяг юу вэ?</h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">7 минутын шалгалт · үнэгүй эхэлнэ</p>
        <ButtonLink to="/" size="lg" className="mt-6">
          Тест өгөх <ArrowRight className="size-4" />
        </ButtonLink>
      </div>
    </div>
  )
}

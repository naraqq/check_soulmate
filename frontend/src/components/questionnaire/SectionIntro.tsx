import { ArrowRight, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Category } from '../../data/types'
import { LemonMark } from '../layout/LemonMark'
import { Button } from '../ui/Button'

/** How long the "understanding…" moment lasts before the reflection appears. */
const THINKING_MS = 1600

interface Props {
  category: Category
  section: number
  sections: number
  questionCount: number
  /** The section the user just completed, with a gentle reflection on it. */
  finished?: { label: string; reflection: string }
  onStart: () => void
}

/**
 * Between sections: a short "understanding you" moment, a reflection on the
 * section just finished, then what comes next. Makes the check feel like a
 * conversation rather than a form.
 */
export function SectionIntro({ category, section, sections, questionCount, finished, onStart }: Props) {
  const [thinking, setThinking] = useState(Boolean(finished))

  useEffect(() => {
    if (!thinking) return
    const timer = window.setTimeout(() => setThinking(false), THINKING_MS)
    return () => window.clearTimeout(timer)
  }, [thinking])

  useEffect(() => {
    if (thinking) return
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && onStart()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [thinking, onStart])

  if (finished && thinking) {
    return (
      <section className="flex min-h-[50dvh] flex-col items-center justify-center text-center animate-fade-in" role="status">
        <LemonMark className="size-16 animate-[spin_4s_linear_infinite]" />
        <p className="mt-6 text-lg text-ink-soft">
          «{finished.label}» хэсгийг ойлгож байна
          <span className="inline-flex w-6 justify-start">
            <span className="animate-pulse">…</span>
          </span>
        </p>
      </section>
    )
  }

  return (
    <section key={category.id} className="flex flex-col items-start py-4 animate-fade-up sm:py-8">
      {finished && (
        <div className="mb-10 w-full">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage">
            <span className="grid size-5 place-items-center rounded-full bg-sage-soft">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            {finished.label}
          </p>
          <div className="mt-4 flex items-start gap-3">
            <LemonMark className="mt-0.5 size-8 shrink-0" />
            <p className="rounded-3xl rounded-tl-md border border-line bg-paper px-5 py-4 text-[17px] leading-relaxed backdrop-blur">
              {finished.reflection}
            </p>
          </div>
        </div>
      )}

      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-clay-dark backdrop-blur">
        {section} / {sections}-р хэсэг · {questionCount} асуулт
      </span>
      <h1 className="mt-6 font-display text-3xl leading-tight font-bold text-balance sm:text-4xl">{category.intro.title}</h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">{category.intro.text}</p>
      <Button size="lg" className="mt-10" onClick={onStart} autoFocus>
        {section === 1 ? 'Эхлэх' : 'Үргэлжлүүлэх'} <ArrowRight className="size-4" />
      </Button>
    </section>
  )
}

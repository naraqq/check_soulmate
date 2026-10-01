import { ArrowRight, Check } from 'lucide-react'
import { useEffect } from 'react'
import type { Category } from '../../data/types'
import { Button } from '../ui/Button'

interface Props {
  category: Category
  section: number
  sections: number
  questionCount: number
  /** The section the user just completed. Only its name is shown — never a verdict, which is part of the paid report. */
  finished?: { label: string }
  onStart: () => void
}

/**
 * Between sections: a tick for the section just finished, then what comes next.
 * Makes the check feel like a conversation rather than a form.
 */
export function SectionIntro({ category, section, sections, questionCount, finished, onStart }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && onStart()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])

  return (
    <section key={category.id} className="flex flex-col items-start py-4 animate-fade-up sm:py-8">
      {finished && (
        <div className="mb-8 w-full">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-sage">
            <span className="grid size-5 place-items-center rounded-full bg-sage-soft">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            {finished.label} — дууслаа
          </p>
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

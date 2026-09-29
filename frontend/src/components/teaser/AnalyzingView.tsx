import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LemonMark } from '../layout/LemonMark'

const STEPS = ['Хариултуудыг тань нэгтгэж байна', 'Та хоёрын хэв маягийг олж байна', 'Дүгнэлтээ бэлтгэж байна']
const STEP_MS = 1100

/** A brief "we're understanding you" moment between the last question and the teaser. */
export function AnalyzingView({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= STEPS.length) {
      const done = window.setTimeout(onDone, 400)
      return () => window.clearTimeout(done)
    }
    const timer = window.setTimeout(() => setStep((s) => s + 1), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [step, onDone])

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center animate-fade-in" role="status">
      <LemonMark className="size-20 animate-[spin_5s_linear_infinite]" />
      <h1 className="mt-8 font-display text-2xl font-bold sm:text-3xl">Баярлалаа. Таныг ойлгож байна…</h1>
      <ul className="mt-8 space-y-3 text-left">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-3 text-[15px] transition-opacity duration-500 ${i <= step ? 'opacity-100' : 'opacity-30'}`}
          >
            <span
              className={`grid size-6 place-items-center rounded-full transition-colors ${i < step ? 'bg-sage-soft text-sage' : 'bg-white/10 text-ink-muted'}`}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}

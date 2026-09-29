import { Check } from 'lucide-react'
import type { AnswerOption, QuestionType } from '../../data/types'
import { cn } from '../../lib/format'

interface Props {
  options: AnswerOption[]
  type: QuestionType
  value: string | null
  onSelect: (value: string) => void
  labelledBy: string
}

/** Large, thumb-friendly single-select list. Keys 1–9 select an option. */
export function OptionList({ options, type, value, onSelect, labelledBy }: Props) {
  const isScale = type === 'scale'
  const isYesNo = type === 'yes_no'

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={cn('grid gap-2.5', isYesNo ? 'grid-cols-2' : 'grid-cols-1')}
    >
      {options.map((option, i) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(option.value)}
            className={cn(
              'group flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-medium transition-all duration-200 sm:text-base',
              'animate-fade-up active:scale-[0.99]',
              isYesNo && 'justify-center py-5 text-center text-lg',
              selected
                ? 'border-transparent bg-accent text-white shadow-glow'
                : 'border-line bg-paper text-ink shadow-soft backdrop-blur hover:-translate-y-px hover:border-white/25 hover:bg-white/[0.08]',
            )}
            style={{ animationDelay: `${i * 35}ms` }}
          >
            {!isYesNo && (
              <span
                aria-hidden
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border transition-colors',
                  selected ? 'border-white/70 bg-white text-fuchsia-600' : 'border-white/20 text-transparent group-hover:border-white/40',
                )}
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            )}
            <span className="flex-1">{option.label}</span>
            {isScale && <ScaleDots position={i} count={options.length} selected={selected} />}
          </button>
        )
      })}
    </div>
  )
}

function ScaleDots({ position, count, selected }: { position: number; count: number; selected: boolean }) {
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            'size-1.5 rounded-full transition-colors',
            i <= position ? (selected ? 'bg-white' : 'bg-clay/70') : selected ? 'bg-white/30' : 'bg-white/15',
          )}
        />
      ))}
    </span>
  )
}

import { Lock, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/format'

type Tone = 'sage' | 'dusk' | 'clay'

const tones: Record<Tone, { chip: string; icon: string }> = {
  sage: { chip: 'bg-sage-soft text-sage', icon: 'text-sage' },
  dusk: { chip: 'bg-dusk-soft text-dusk', icon: 'text-dusk' },
  clay: { chip: 'bg-clay-soft text-clay-dark', icon: 'text-clay' },
}

interface Props {
  heading: string
  items: string[]
  tone: Tone
  icon: LucideIcon
}

/** Teaser titles with a locked, blurred explanation — the detail is what the report unlocks. */
export function TeaserList({ heading, items, tone, icon: Icon }: Props) {
  if (items.length === 0) return null
  return (
    <div>
      <p className={cn('mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', tones[tone].chip)}>
        <Icon className="size-3.5" aria-hidden /> {heading}
      </p>
      <ul className="space-y-2.5">
        {items.map((title) => (
          <li key={title} className="rounded-2xl border border-line/80 bg-paper px-4 py-3.5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{title}</p>
              <Lock className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-label="Түгжээтэй" />
            </div>
            <p aria-hidden className="mt-1.5 select-none text-sm text-ink-soft blur-[5px]">
              Таны хариултаас харахад энэ хэсэгт нэгэн сонирхолтой хэв маяг ажиглагдаж байна.
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

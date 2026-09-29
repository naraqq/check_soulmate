import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RelationshipReport, ReportSection } from '../../lib/api'
import { cn } from '../../lib/format'

export function SectionHeading({ icon: Icon, eyebrow, title }: { icon: LucideIcon; eyebrow?: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-paper shadow-soft">
        <Icon className="size-5 text-clay" aria-hidden />
      </span>
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
      </div>
    </div>
  )
}

export function ReportBlock({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-24 animate-fade-up', className)}>
      {children}
    </section>
  )
}

export function TitledCards({
  items,
  tone,
}: {
  items: { title: string; description: string }[]
  tone: 'sage' | 'dusk'
}) {
  const accent = tone === 'sage' ? 'bg-sage' : 'bg-dusk'
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.title} className="relative overflow-hidden rounded-3xl border border-line/80 bg-paper p-5 shadow-soft">
          <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', accent)} />
          <h3 className="font-semibold">{item.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{item.description}</p>
        </article>
      ))}
    </div>
  )
}

const importanceLabel: Record<RelationshipReport['areas_to_explore'][number]['importance'], string> = {
  low: 'Бага ач холбогдол',
  moderate: 'Дунд ач холбогдол',
  high: 'Өндөр ач холбогдол',
}

/** Neutral dot scale instead of red/yellow/green severity colours. */
export function AreaCards({ items }: { items: RelationshipReport['areas_to_explore'] }) {
  const level = { low: 1, moderate: 2, high: 3 }
  return (
    <div className="space-y-3">
      {items.map((area) => (
        <article key={area.title} className="rounded-3xl border border-line/80 bg-paper p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="font-semibold">{area.title}</h3>
            <span className="inline-flex items-center gap-2 rounded-full bg-dusk-soft px-3 py-1 text-xs font-medium text-dusk">
              <span className="flex gap-0.5" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={cn('size-1.5 rounded-full', n <= level[area.importance] ? 'bg-dusk' : 'bg-dusk/25')} />
                ))}
              </span>
              {importanceLabel[area.importance]}
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{area.description}</p>
        </article>
      ))}
    </div>
  )
}

export function CategoryCard({ icon: Icon, title, section }: { icon: LucideIcon; title: string; section: ReportSection }) {
  return (
    <article className="rounded-3xl border border-line/80 bg-paper p-6 shadow-soft sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-clay-soft">
          <Icon className="size-5 text-clay-dark" aria-hidden />
        </span>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
      </div>
      <p className="leading-relaxed text-ink">{section.summary}</p>
      {section.observations.length > 0 && (
        <ul className="mt-5 space-y-2.5 border-t border-line/70 pt-5">
          {section.observations.map((obs) => (
            <li key={obs} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-clay/60" />
              {obs}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

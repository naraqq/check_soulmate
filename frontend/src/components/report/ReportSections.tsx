import { CircleAlert, CircleCheck, Lightbulb, MessageCircleHeart, Sprout, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PotentialLevel, RelationshipReport, ReportSection, SectionState } from '../../lib/api'
import { EvidenceDetails } from './EvidenceDetails'
import { cn } from '../../lib/format'

/** Same neutral palette as the topic chips — a read on the signals, not a traffic light. */
const potentialStyles: Record<PotentialLevel, { label: string; chip: string; dot: string; active: number }> = {
  promising: { label: 'Ирээдүйтэй дохио', chip: 'bg-sage-soft text-sage', dot: 'bg-sage', active: 3 },
  unclear: { label: 'Одоохондоо тодорхойгүй', chip: 'bg-clay-soft text-clay-dark', dot: 'bg-clay', active: 2 },
  mixed_signals: { label: 'Холимог дохио', chip: 'bg-dusk-soft text-dusk', dot: 'bg-dusk', active: 1 },
}

/** Early stage: "is this going to work?" answered as what the signals show so far. */
export function PotentialCard({ potential }: { potential: NonNullable<RelationshipReport['potential']> }) {
  const style = potentialStyles[potential.level] ?? potentialStyles.unclear
  return (
    <article className="rounded-4xl border border-line bg-paper p-7 shadow-lift sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Энэ харилцаа ирээдүйтэй юу?</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold', style.chip)}>
          <span className="flex gap-0.5" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span key={n} className={cn('size-2 rounded-full', n <= style.active ? style.dot : 'bg-current opacity-20')} />
            ))}
          </span>
          {style.label}
        </span>
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold text-balance sm:text-3xl">{potential.title}</h2>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-soft">{potential.explanation}</p>
      <p className="mt-5 text-xs text-ink-muted">Энэ бол одоогийн дохионууд дээр суурилсан дүгнэлт — баталгаа биш.</p>
    </article>
  )
}

export function FlagLists({ green, red }: { green: string[]; red: string[] }) {
  if (green.length === 0 && red.length === 0) return null
  const lists = [
    { title: 'Сайн дохионууд', items: green, icon: CircleCheck, color: 'text-sage' },
    { title: 'Анхаарах дохионууд', items: red, icon: CircleAlert, color: 'text-dusk' },
  ].filter((l) => l.items.length > 0)
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {lists.map(({ title, items, icon: Icon, color }) => (
        <div key={title} className="rounded-3xl border border-line/80 bg-paper p-5 shadow-soft sm:p-6">
          <h3 className={cn('flex items-center gap-2 font-semibold', color)}>
            <Icon className="size-5" aria-hidden /> {title}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {items.map((item) => (
              <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                <span aria-hidden className={cn('mt-2.5 size-1.5 shrink-0 rounded-full bg-current', color)} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

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

/** Neutral status tags — teal / violet / pink, never red-yellow-green "health" colours. */
const stateStyles: Record<SectionState, { label: string; chip: string; dot: string }> = {
  strength: { label: 'Бат бөх тал', chip: 'bg-sage-soft text-sage', dot: 'bg-sage' },
  mixed: { label: 'Холимог', chip: 'bg-clay-soft text-clay-dark', dot: 'bg-clay' },
  attention: { label: 'Анхаарах нь зүйтэй', chip: 'bg-dusk-soft text-dusk', dot: 'bg-dusk' },
}

export function StateChip({ state }: { state?: SectionState }) {
  if (!state) return null
  const s = stateStyles[state]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', s.chip)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}

export interface CategoryItem {
  key: string
  title: string
  icon: LucideIcon
  section: ReportSection
}

/** At-a-glance grid: every topic with its status; tapping jumps to the detailed card. */
export function CategoryOverview({ items }: { items: CategoryItem[] }) {
  return (
    <nav aria-label="Чиглэлүүд" className="no-print grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map(({ key, title, icon: Icon, section }) => (
        <a
          key={key}
          href={`#topic-${key}`}
          className="flex flex-col gap-2.5 rounded-2xl border border-line bg-paper p-3.5 backdrop-blur transition hover:-translate-y-px hover:border-white/25"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="size-4 shrink-0 text-clay" aria-hidden /> {title}
          </span>
          <StateChip state={section.state} />
        </a>
      ))}
    </nav>
  )
}

export function CategoryCard({ item }: { item: CategoryItem }) {
  const { key, title, icon: Icon, section } = item
  return (
    <article id={`topic-${key}`} className="scroll-mt-24 rounded-3xl border border-line bg-paper p-6 shadow-soft backdrop-blur sm:p-8">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-clay-soft">
            <Icon className="size-5 text-clay-dark" aria-hidden />
          </span>
          <h3 className="font-display text-xl font-bold">{title}</h3>
        </div>
        <StateChip state={section.state} />
      </header>

      <p className="text-[17px] leading-relaxed text-ink">{section.insight ?? section.summary}</p>

      <EvidenceDetails evidence={section.evidence} uncertainty={section.uncertainty} />

      {section.healthy && (
        <div className="mt-6 rounded-2xl border border-teal-300/15 bg-sage-soft p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-sage">
            <Sprout className="size-4" aria-hidden /> Эрүүл харилцаанд ийм байдаг
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{section.healthy}</p>
        </div>
      )}

      {section.steps && section.steps.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Юу хийж болох вэ</p>
          <ol className="mt-3 space-y-2.5">
            {section.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-clay-soft text-xs font-bold text-clay-dark">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {section.try_saying && (
        <div className="mt-6 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-pink-500/8 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-clay-dark">
            <MessageCircleHeart className="size-4" aria-hidden /> Ингэж хэлээд үзээрэй
          </p>
          <p className="mt-2 text-[17px] leading-relaxed font-medium text-ink">“{section.try_saying}”</p>
        </div>
      )}

      {/* Older reports only */}
      {section.observations && section.observations.length > 0 && (
        <ul className="mt-5 space-y-3">
          {section.observations.map((obs) => (
            <li key={obs} className="flex gap-3 text-[15px] leading-relaxed text-ink-soft">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-clay/70" />
              {obs}
            </li>
          ))}
        </ul>
      )}

      {section.tip && (
        <div className="mt-6 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/12 to-pink-500/8 p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-clay-dark">
            <Lightbulb className="size-4" aria-hidden /> Туршиж үзэх зүйл
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink">{section.tip}</p>
        </div>
      )}
    </article>
  )
}

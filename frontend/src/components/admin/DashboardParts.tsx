import { ArrowDownRight, ArrowUpRight, Check, Copy, Minus, type LucideIcon } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { num, pct } from '../../lib/adminApi'
import { cn } from '../../lib/format'

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Panel({
  icon: Icon,
  title,
  hint,
  action,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  /** One line on how to use this for marketing decisions. */
  hint?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('min-w-0 rounded-3xl border border-line bg-paper p-5 sm:p-6', className)}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon className="size-4 shrink-0 text-clay" aria-hidden /> {title}
          </h2>
          {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Stat tiles
// ---------------------------------------------------------------------------

export function StatTile({
  label,
  value,
  current,
  previous,
  days,
  hero,
}: {
  label: string
  value: string
  current: number
  previous: number
  days: number
  hero?: boolean
}) {
  const change = previous > 0 ? (current - previous) / previous : null
  const Icon = change === null || Math.abs(change) < 0.005 ? Minus : change > 0 ? ArrowUpRight : ArrowDownRight
  // Every KPI here is "up is good".
  const tone = change === null || Math.abs(change) < 0.005 ? 'text-ink-muted' : change > 0 ? 'text-sage' : 'text-dusk'
  return (
    <div className={cn('rounded-3xl border border-line bg-paper p-5', hero && 'sm:col-span-2')}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={cn('mt-2 font-semibold tabular-nums', hero ? 'text-5xl' : 'text-3xl')}>{value}</p>
      <p className={cn('mt-2 flex items-center gap-1 text-xs', tone)}>
        <Icon className="size-3.5" aria-hidden />
        {change === null ? 'Өмнөх хугацааны мэдээлэл алга' : `${change > 0 ? '+' : ''}${(change * 100).toFixed(0)}% (өмнөх ${days} хоногтой харьцуулахад)`}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Funnel — horizontal bars, one hue; the biggest drop is called out.
// ---------------------------------------------------------------------------

export interface FunnelStep {
  label: string
  value: number
}

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.value ?? 0)
  const drops = steps.map((s, i) => (i === 0 ? 0 : Math.max(0, steps[i - 1].value - s.value)))
  const worst = drops.indexOf(Math.max(...drops))

  return (
    <ol className="space-y-3">
      {steps.map((step, i) => {
        const fromPrev = i === 0 ? null : steps[i - 1].value > 0 ? step.value / steps[i - 1].value : null
        return (
          <li key={step.label}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{step.label}</span>
              <span className="tabular-nums text-ink-soft">
                <span className="font-semibold text-ink">{num(step.value)}</span>
                <span className="text-ink-muted"> · зочдын {pct(step.value / top, 0)}</span>
                {fromPrev !== null && <span className="text-ink-muted"> · өмнөх алхмын {pct(fromPrev, 0)}</span>}
              </span>
            </div>
            <div className="h-3 rounded-r bg-white/[0.04]">
              <div
                className="h-3 rounded-r bg-clay transition-[width] duration-500"
                style={{ width: `${Math.max(step.value > 0 ? 1 : 0, (step.value / top) * 100)}%` }}
              />
            </div>
            {i === worst && drops[i] > 0 && (
              <p className="mt-1.5 text-xs font-medium text-dusk">
                Хамгийн их алдагдал: энэ алхмаас өмнө {num(drops[i])} хүн гарсан
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Daily columns — small multiples (one measure per chart, never two axes).
// ---------------------------------------------------------------------------

export function DailyColumns<T extends { day: string }>({
  title,
  rows,
  value,
  format = num,
  detail,
}: {
  title: string
  rows: T[]
  value: (row: T) => number
  format?: (n: number) => string
  /** Extra tooltip line, e.g. revenue for paid customers. */
  detail?: (row: T) => string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...rows.map(value))
  const total = rows.reduce((sum, r) => sum + value(r), 0)
  const labelId = useId()
  const shown = hover !== null ? rows[hover] : null

  return (
    <figure aria-labelledby={labelId}>
      <figcaption id={labelId} className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-ink-soft">{title}</span>
        <span className="font-semibold tabular-nums">{format(total)}</span>
      </figcaption>
      <div className="relative mt-3">
        <div className="flex h-28 items-end gap-[2px] border-b border-line" onPointerLeave={() => setHover(null)}>
          {rows.map((row, i) => (
            <button
              key={row.day}
              type="button"
              className="group flex h-full min-w-0 flex-1 cursor-default items-end justify-center focus:outline-none"
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${row.day}: ${format(value(row))}`}
            >
              <span
                className={cn('block w-full max-w-6 rounded-t bg-clay transition-opacity', hover !== null && hover !== i && 'opacity-40')}
                style={{ height: `${(value(row) / max) * 100}%`, minHeight: value(row) > 0 ? 2 : 0 }}
              />
            </button>
          ))}
        </div>
        {shown && (
          <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-line bg-cream px-3 py-2 text-xs shadow-lift">
            <p className="font-semibold tabular-nums text-ink">{format(value(shown))}</p>
            <p className="text-ink-muted">{shown.day}</p>
            {detail && <p className="text-ink-soft">{detail(shown)}</p>}
          </div>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-ink-muted tabular-nums">
        <span>{rows[0]?.day.slice(5)}</span>
        <span>{rows.at(-1)?.day.slice(5)}</span>
      </div>
    </figure>
  )
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export interface Column<T> {
  label: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  /** Short explanation shown as a tooltip on the header. */
  help?: string
}

export function DataTable<T>({ columns, rows, rowKey, empty }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; empty: string }) {
  if (rows.length === 0) return <p className="rounded-2xl bg-white/[0.03] px-4 py-6 text-center text-sm text-ink-muted">{empty}</p>
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-ink-muted">
            {columns.map((c) => (
              <th key={c.label} scope="col" title={c.help} className={cn('py-2 pr-4 font-medium last:pr-0', c.align === 'right' && 'text-right')}>
                {c.label}
                {c.help && <span aria-hidden> ⓘ</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line/60 last:border-0">
              {columns.map((c) => (
                <td key={c.label} className={cn('py-2.5 pr-4 last:pr-0', c.align === 'right' && 'text-right tabular-nums')}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A share shown as a thin bar next to its number — for compact breakdowns. */
export function ShareBar({ label, value, total }: { label: string; value: number; total: number }) {
  const share = total > 0 ? value / total : 0
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-ink-soft">
          {num(value)} <span className="text-ink-muted">({pct(share, 0)})</span>
        </span>
      </div>
      <div className="mt-1 h-2 rounded-r bg-white/[0.04]">
        <div className="h-2 rounded-r bg-clay" style={{ width: `${share * 100}%` }} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// UTM link builder — every ad or post link should carry these.
// ---------------------------------------------------------------------------

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9._+-]+/g, '-').replace(/^-|-$/g, '')

export function UtmBuilder() {
  const [base, setBase] = useState(() => window.location.origin)
  const [source, setSource] = useState('facebook')
  const [medium, setMedium] = useState('paid_social')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  let link = ''
  try {
    const url = new URL(base)
    if (slug(source)) url.searchParams.set('utm_source', slug(source))
    if (slug(medium)) url.searchParams.set('utm_medium', slug(medium))
    if (slug(campaign)) url.searchParams.set('utm_campaign', slug(campaign))
    link = url.toString()
  } catch {
    link = ''
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the link stays selectable below.
    }
  }

  const field = 'mt-1 h-10 w-full rounded-xl border border-line bg-white/[0.04] px-3 text-sm outline-none focus:border-clay'
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-ink-muted sm:col-span-2">
          Хуудас
          <input className={field} value={base} onChange={(e) => setBase(e.target.value)} />
        </label>
        <label className="text-xs text-ink-muted">
          Эх сурвалж <span className="text-ink-muted/70">(хаанаас: facebook, instagram, tiktok, инфлюэнсерийн нэр)</span>
          <input className={field} value={source} onChange={(e) => setSource(e.target.value)} list="utm-sources" />
        </label>
        <label className="text-xs text-ink-muted">
          Хэлбэр <span className="text-ink-muted/70">(хэрхэн: paid_social, organic, story, bio)</span>
          <input className={field} value={medium} onChange={(e) => setMedium(e.target.value)} list="utm-mediums" />
        </label>
        <label className="text-xs text-ink-muted sm:col-span-2">
          Кампанит ажил <span className="text-ink-muted/70">(аль зар эсвэл пост: oct-early-stage-video)</span>
          <input className={field} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="oct-launch" />
        </label>
      </div>
      <datalist id="utm-sources">
        {['facebook', 'instagram', 'tiktok', 'google', 'youtube', 'telegram'].map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="utm-mediums">
        {['paid_social', 'organic', 'story', 'bio', 'influencer', 'cpc'].map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <div className="flex items-stretch gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl bg-white/[0.04] px-3 py-2.5 text-xs text-ink-soft select-all">
          {link || 'Хуудасны зөв хаяг (URL) оруулна уу'}
        </code>
        <button
          type="button"
          onClick={copy}
          disabled={!link}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          {copied ? <Check className="size-4 text-sage" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? 'Хуулсан' : 'Хуулах'}
        </button>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Eyebrow } from '../ui/Card'

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-3 font-display text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-sm text-ink-muted">Сүүлд шинэчилсэн: {updated}</p>
      <div className="mt-10 space-y-8 leading-relaxed text-ink-soft [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  )
}

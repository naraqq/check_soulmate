import type { ReportEvidence } from '../../lib/api'

export function EvidenceDetails({ evidence, uncertainty }: { evidence?: ReportEvidence[]; uncertainty?: string }) {
  if (!evidence && !uncertainty) return null
  return (
    <div className="mt-5 space-y-3 text-sm leading-relaxed">
      {evidence && evidence.length > 0 && (
        <details className="rounded-2xl border border-line bg-paper p-4">
          <summary className="cursor-pointer font-semibold">Энэ дүгнэлт юунд тулгуурлав?</summary>
          <ul className="mt-3 space-y-3">
            {evidence.map((item) => (
              <li key={item.question}>
                <p className="text-ink-soft">{item.question}</p>
                <p className="mt-1 font-medium">Таны хуваалцсан нь: {item.answer}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {uncertainty && <p className="text-ink-soft"><strong className="text-ink">Одоохондоо тодорхойгүй нь: </strong>{uncertainty}</p>}
    </div>
  )
}

export function EvidenceDetails({ uncertainty }: { uncertainty?: string }) {
  if (!uncertainty) return null
  return (
    <div className="mt-5 space-y-3 text-sm leading-relaxed">
      <p className="text-ink-soft"><strong className="text-ink">Одоохондоо тодорхойгүй нь: </strong>{uncertainty}</p>
    </div>
  )
}

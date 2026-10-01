/** Keep uncertainty visible without repeating the user's questionnaire answers. */
export function EvidenceDetails({ uncertainty }: { uncertainty?: string }) {
  if (!uncertainty) return null
  return (
    <p className="mt-5 text-sm leading-relaxed text-ink-soft">
      <strong className="text-ink">Одоохондоо тодорхойгүй нь: </strong>{uncertainty}
    </p>
  )
}

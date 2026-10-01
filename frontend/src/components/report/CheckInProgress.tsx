import type { CheckInComparison } from '../../lib/api'

const directions = {
  improved: 'Илүү олон тохиолдож байна',
  declined: 'Цөөн тохиолдож байна',
  unchanged: 'Ижил хариулт',
  not_comparable: 'Харьцуулах мэдээлэл дутуу',
}

export function CheckInProgress({ comparison }: { comparison: CheckInComparison }) {
  if (comparison.status !== 'compared') return null
  const date = (value: string) => {
    const day = new Date(value)
    return `${day.getFullYear()} оны ${day.getMonth() + 1} сарын ${day.getDate()}`
  }
  return (
    <section className="mb-12 rounded-3xl border border-line bg-paper p-5 sm:p-8" aria-labelledby="checkin-title">
      <h2 id="checkin-title" className="font-display text-2xl font-semibold">Өмнөхөөс юу өөрчлөгдөв?</h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        {`${comparison.previous_date ? date(comparison.previous_date) : ''} ба ${comparison.current_date ? date(comparison.current_date) : ''} — ижил гурван асуултад өгсөн таны хариултууд.`}
        {' '}Энэ нь таны тухайн үеийн туршлага болохоос харилцааны оноо биш.
      </p>
      {comparison.days_between !== undefined && comparison.days_between < 14 && (
        <p className="mt-3 text-sm text-ink-soft">Хоёр шалгалтын хооронд 2 долоо хоногоос бага хугацаа өнгөрсөн тул бодож хариулсан өдрүүд давхцаж болно. Үүнийг тогтвортой өөрчлөлт гэж дүгнэхэд эрт байна.</p>
      )}
      {comparison.stage_changed && <p className="mt-3 text-sm text-ink-soft">Харилцааны шат өөрчлөгдсөн байна. Зөвхөн ижил утгатай гурван асуултыг харьцууллаа.</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {comparison.items.map((item) => (
          <article key={item.topic} className="rounded-2xl border border-line p-4">
            <h3 className="font-semibold">{item.label}</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div><dt className="text-ink-muted">Өмнө</dt><dd>{item.previous ?? 'Хэлж мэдэхгүй / мэдээлэл байхгүй'}</dd></div>
              <div><dt className="text-ink-muted">Одоо</dt><dd>{item.current ?? 'Хэлж мэдэхгүй / мэдээлэл байхгүй'}</dd></div>
            </dl>
            <p className="mt-3 text-sm font-medium">{directions[item.direction]}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

import type { PartnerShareContent } from '../../lib/api'

import { partnerShareSections } from '../../lib/partnerShare'

export function PartnerSharePreview({ content }: { content: PartnerShareContent }) {
  return (
    <div className="space-y-6 rounded-2xl border border-line bg-paper p-5 text-left break-words">
      <div>
        <h2 className="text-xl font-semibold">Чамтай энэ талаар ярилцмаар байна</h2>
        <p className="mt-3 text-sm text-ink-soft">Энэ бол миний өнцгөөс харсан зүйлс. Чамд ямар санагдаж байгааг бас сонсмоор байна.</p>
      </div>
      {partnerShareSections.map(({ key, label }) => content[key]?.length ? (
        <section key={key}>
          <h3 className="font-semibold">{label}</h3>
          <ul className="mt-3 space-y-3 text-sm text-ink-soft">
            {content[key]!.map((item, index) => <li key={index}>{typeof item === 'string' ? item : <><strong className="text-ink">{item.title}</strong><p className="mt-1">{item.description}</p></>}</li>)}
          </ul>
        </section>
      ) : null)}
      <p className="border-t border-line pt-4 text-xs text-ink-muted">Нэг хүний хариултад тулгуурласан тайлангаас сонгосон хэсгүүд. Энэ нь та хоёрын харилцааны эцсийн дүгнэлт биш.</p>
    </div>
  )
}

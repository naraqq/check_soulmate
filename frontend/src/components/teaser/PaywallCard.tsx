import { Check, Lock, ShieldCheck } from 'lucide-react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { formatPrice } from '../../lib/format'
import { Button } from '../ui/Button'

const COVERED = ['Харилцан яриа', 'Итгэлцэл', 'Энхрийлэл', 'Хүчин чармайлт', 'Маргаан ба эвлэрэл', 'Бие даасан байдал', 'Ирээдүйн хүлээлт']

interface Props {
  onUnlock: () => void
  loading: boolean
  error: string | null
}

export function PaywallCard({ onUnlock, loading, error }: Props) {
  const { price, currency } = useAppConfig()

  return (
    <div className="relative overflow-hidden rounded-4xl surface-hero p-6 shadow-lift sm:p-10">
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-clay-dark">Таны харилцааны тайлан бэлэн боллоо</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-balance sm:text-4xl">
          Бүрэн, хувийн тайлангаа <span className="text-gradient">нээгээрэй</span>
        </h2>
        <p className="mt-3 text-ink-soft">Таны хариултуудыг дараах чиглэлүүдээр нарийвчлан шинжилнэ:</p>

        <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {COVERED.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-[15px]">
              <span className="grid size-5 place-items-center rounded-full bg-accent">
                <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-4xl font-bold">{formatPrice(price, currency)}</p>
            <p className="mt-1 text-sm text-ink-muted">Нэг удаагийн төлбөр · QPay-ээр</p>
          </div>
          <Button
            size="lg"
            onClick={onUnlock}
            loading={loading}
            className="w-full sm:w-auto"
          >
            <Lock className="size-4" aria-hidden /> Тайлангаа нээх
          </Button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-dusk-soft px-4 py-3 text-sm text-ink">
            {error}
          </p>
        )}

        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Таны хариултууд зөвхөн төлбөр баталгаажсаны дараа тайлан үүсгэхэд ашиглагдана. Бүртгэл шаардлагагүй.
        </p>
      </div>
    </div>
  )
}

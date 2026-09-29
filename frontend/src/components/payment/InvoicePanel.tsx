import { ExternalLink, Smartphone } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import type { InvoiceDisplay } from '../../lib/api'
import { formatPrice } from '../../lib/format'

interface Props {
  invoice: InvoiceDisplay
  amount: number
  currency: string
}

/** QPay invoice: bank-app deep links first (mobile), QR code for scanning from another device. */
export function InvoicePanel({ invoice, amount, currency }: Props) {
  const qrSrc = useQrSource(invoice)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-ink-muted">Төлөх дүн</p>
        <p className="font-display text-4xl font-bold text-gradient">{formatPrice(amount, currency)}</p>
      </div>

      {invoice.deeplinks.length > 0 && (
        <div className="sm:hidden">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Smartphone className="size-4 text-clay" aria-hidden /> Банкны аппаа сонгоно уу
          </p>
          <BankLinks invoice={invoice} />
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="rounded-3xl border border-line bg-white p-4 shadow-soft">
          {qrSrc ? (
            <img src={qrSrc} alt="QPay төлбөрийн QR код" className="size-56 sm:size-64" />
          ) : (
            <div className="size-56 animate-pulse rounded-2xl bg-sand sm:size-64" aria-hidden />
          )}
        </div>
        <p className="mt-3 text-center text-sm text-ink-muted">Банкны аппликейшнээрээ QR кодыг уншуулна уу</p>
        {/* Paying on the same phone: the screen can't be scanned, but a saved image can. */}
        <p className="mt-3 max-w-xs rounded-2xl bg-sand/60 px-4 py-3 text-center text-[13px] leading-relaxed text-ink-soft sm:hidden">
          Утсаараа төлж байна уу? QR кодыг <span className="font-semibold text-ink">удаан дараад хадгалаарай</span>, дараа нь
          банкны аппынхаа QR уншигчаас тэр зургаа сонгоорой.
        </p>
      </div>

      <ol className="space-y-2 rounded-2xl bg-sand/60 p-4 text-[15px] text-ink-soft">
        <li>1. Банкны аппликейшнээ нээнэ үү.</li>
        <li>2. QR кодыг уншуулах эсвэл банкны аппаа сонгоно уу.</li>
        <li>3. Төлбөр төлсний дараа энэ хуудас автоматаар шинэчлэгдэнэ.</li>
      </ol>

      {invoice.deeplinks.length > 0 && (
        <details className="hidden rounded-2xl border border-line bg-paper p-4 sm:block">
          <summary className="cursor-pointer text-sm font-semibold">Банкны аппаар төлөх</summary>
          <div className="mt-4">
            <BankLinks invoice={invoice} />
          </div>
        </details>
      )}

      {invoice.short_url && (
        <a
          href={invoice.short_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          QPay хуудсаар нээх <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </div>
  )
}

function BankLinks({ invoice }: { invoice: InvoiceDisplay }) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {invoice.deeplinks.map((bank) => (
        <li key={`${bank.name}-${bank.link}`}>
          <a
            href={bank.link}
            className="flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-paper p-3 text-center text-xs font-medium shadow-soft transition hover:border-ink/25 active:scale-[0.98]"
          >
            {bank.logo ? (
              <img src={bank.logo} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-10 rounded-xl object-contain" />
            ) : (
              <span className="grid size-10 place-items-center rounded-xl bg-sand text-sm font-semibold">{bank.name.slice(0, 1)}</span>
            )}
            <span className="line-clamp-2">{bank.description || bank.name}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

/** QPay returns a base64 PNG; fall back to rendering qr_text locally when it doesn't. */
function useQrSource(invoice: InvoiceDisplay) {
  const provided = invoice.qr_image ? `data:image/png;base64,${invoice.qr_image}` : null
  const [generated, setGenerated] = useState<{ text: string; src: string } | null>(null)

  useEffect(() => {
    if (provided) return
    let active = true
    QRCode.toDataURL(invoice.qr_text, { margin: 1, width: 512, color: { dark: '#251d18', light: '#ffffff' } })
      .then((src) => active && setGenerated({ text: invoice.qr_text, src }))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [provided, invoice.qr_text])

  return provided ?? (generated?.text === invoice.qr_text ? generated.src : null)
}

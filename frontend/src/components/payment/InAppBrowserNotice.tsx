import { Check, Copy, ExternalLink, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { copyText, externalBrowserUrl, type InAppBrowser } from '../../lib/inAppBrowser'
import { Button } from '../ui/Button'

/**
 * Shown on the payment page inside Messenger/Facebook/Instagram browsers,
 * where bank-app deep links are blocked. The payment URL carries the
 * assessment token, so reopening it in Safari/Chrome lands on the same invoice.
 */
export function InAppBrowserNotice({ browser }: { browser: InAppBrowser & { app: string } }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.href
  const external = externalBrowserUrl(url, browser.platform)
  const browserName = browser.platform === 'ios' ? 'Safari' : 'Chrome'

  async function copy() {
    if (await copyText(url)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="mb-6 rounded-3xl border border-yellow-300/25 bg-lemon-soft p-5 animate-fade-up" role="note">
      <p className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-5 shrink-0 text-lemon" aria-hidden />
        Банкны апп нээгдэхгүй байна уу?
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        Та {browser.app} доторх хөтчөөр орсон байна. {browser.app} банкны апп руу шилжихийг хаадаг тул энэ хуудсыг{' '}
        {browserName}-д нээгээд төлнө үү. Таны нэхэмжлэх хэвээрээ байна.
      </p>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        {external && (
          <a
            href={external}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 font-semibold text-white"
          >
            <ExternalLink className="size-4" aria-hidden /> {browserName}-д нээх
          </a>
        )}
        <Button variant="secondary" onClick={copy} className="h-12">
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? 'Хуулагдлаа' : 'Холбоос хуулах'}
        </Button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        Товч ажиллахгүй бол: дэлгэцийн буланд байрлах <span className="font-semibold text-ink">•••</span> цэсийг дараад{' '}
        <span className="font-semibold text-ink">«Open in {browserName}»</span>-г сонгоорой. Эсвэл хуулсан холбоосоо{' '}
        {browserName}-д буулгаарай.
      </p>
    </div>
  )
}

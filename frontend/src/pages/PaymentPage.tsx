import { RefreshCw, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { InAppBrowserNotice } from '../components/payment/InAppBrowserNotice'
import { InvoicePanel } from '../components/payment/InvoicePanel'
import { detectInAppBrowser } from '../lib/inAppBrowser'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card, Eyebrow } from '../components/ui/Card'
import { ErrorView, LoadingView } from '../components/ui/StateView'
import { track } from '../lib/analytics'
import { api, isValidToken, type PaymentResponse } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { storage } from '../lib/storage'

const POLL_INTERVAL_MS = 4000
const POLL_MAX_MS = 15 * 60 * 1000

type PendingInvoice = Extract<PaymentResponse, { status: 'pending' }>

type State = { kind: 'loading' } | { kind: 'invoice'; data: PendingInvoice } | { kind: 'error'; message: string }

export function PaymentPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [checking, setChecking] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const pollStarted = useRef(0) // set when polling starts
  // Messenger/Facebook/Instagram browsers block bank-app links (notably on iPhone).
  const [inApp] = useState(() => detectInAppBrowser(typeof navigator === 'undefined' ? '' : navigator.userAgent))

  const onPaid = useCallback(() => {
    track({ name: 'payment_confirmed' })
    navigate(`/report/${token}`, { replace: true })
  }, [navigate, token])

  // Create (or reuse) the invoice.
  useEffect(() => {
    if (!isValidToken(token)) return
    storage.saveAssessment(token)
    let active = true
    track({ name: 'payment_started' })
    api
      .createPayment(token)
      .then((data) => {
        if (!active) return
        if (data.status === 'paid') onPaid()
        else setState({ kind: 'invoice', data })
      })
      .catch((e) => active && setState({ kind: 'error', message: friendlyError(e) }))
    return () => {
      active = false
    }
  }, [token, onPaid, attempt])

  // Poll the backend (which verifies with QPay) while the invoice is shown.
  useEffect(() => {
    if (state.kind !== 'invoice' || !isValidToken(token)) return
    pollStarted.current = Date.now()
    let timer: number | undefined
    let active = true

    const tick = async () => {
      if (!active || Date.now() - pollStarted.current > POLL_MAX_MS) return
      if (document.visibilityState === 'visible') {
        try {
          const status = await api.paymentStatus(token)
          if (status.status === 'paid') return active && onPaid()
        } catch {
          // Transient errors are fine here; the manual button surfaces problems.
        }
      }
      if (active) timer = window.setTimeout(tick, POLL_INTERVAL_MS)
    }
    timer = window.setTimeout(tick, POLL_INTERVAL_MS)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [state.kind, token, onPaid])

  async function checkNow() {
    if (!isValidToken(token)) return
    setChecking(true)
    setNotice(null)
    try {
      const status = await api.paymentStatus(token)
      if (status.status === 'paid') onPaid()
      else setNotice('Төлбөр хараахан баталгаажаагүй байна. Төлсний дараа хэдэн секунд хүлээгээд дахин шалгана уу.')
    } catch (e) {
      setNotice(friendlyError(e))
    } finally {
      setChecking(false)
    }
  }

  async function devBypass() {
    if (!isValidToken(token)) return
    try {
      await api.devMarkPaid(token)
      onPaid()
    } catch (e) {
      setNotice(friendlyError(e))
    }
  }

  if (!isValidToken(token)) {
    return (
      <ErrorView
        title="Холбоос буруу байна"
        message="Энэ төлбөрийн холбоос хүчингүй байна."
        action={<ButtonLink to="/">Нүүр хуудас</ButtonLink>}
      />
    )
  }

  if (state.kind === 'loading') {
    return <LoadingView title="Нэхэмжлэх үүсгэж байна…" message="QPay-тэй холбогдож байна." />
  }

  if (state.kind === 'error') {
    return (
      <ErrorView
        title="Нэхэмжлэх үүсгэж чадсангүй"
        message={state.message}
        action={
          <>
            <Button onClick={() => { setState({ kind: 'loading' }); setAttempt((a) => a + 1) }}>
              <RefreshCw className="size-4" /> Дахин оролдох
            </Button>
            <ButtonLink to="/complete" variant="quiet">
              Буцах
            </ButtonLink>
          </>
        }
      />
    )
  }

  const { data } = state

  return (
    <div className="mx-auto max-w-lg px-4 pt-8 pb-20 sm:px-6 sm:pt-14">
      <div className="mb-8 text-center animate-fade-up">
        <Eyebrow>Төлбөр</Eyebrow>
        <h1 className="mt-2 font-display text-3xl font-semibold text-balance">Тайлангаа нээхийн тулд төлбөрөө төлнө үү</h1>
      </div>

      {inApp.app && <InAppBrowserNotice browser={{ ...inApp, app: inApp.app }} />}

      <Card className="animate-fade-up [animation-delay:80ms]">
        {data.invoice ? (
          <InvoicePanel invoice={data.invoice} amount={data.amount} currency={data.currency} />
        ) : (
          <p className="text-center text-ink-soft">Нэхэмжлэхийн мэдээлэл олдсонгүй. Дахин оролдоно уу.</p>
        )}

        <div className="mt-8 space-y-3">
          <Button size="lg" className="w-full" onClick={checkNow} loading={checking}>
            Төлбөр шалгах
          </Button>
          {notice && (
            <p role="status" className="rounded-2xl bg-sand px-4 py-3 text-center text-sm text-ink-soft">
              {notice}
            </p>
          )}
          <p className="flex items-center justify-center gap-2 text-center text-xs text-ink-muted">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sage opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-sage" />
            </span>
            Төлбөрийг автоматаар шалгаж байна
          </p>
        </div>

        {/* Test "skip QPay" button — shown whenever the server reports the bypass as enabled (see PaymentBypass). */}
        {data.dev_bypass && (
          <div className="mt-6 rounded-2xl border border-dashed border-dusk/40 bg-dusk-soft/50 p-4 text-center">
            <p className="mb-2 text-xs font-semibold text-dusk">Туршилтын горим</p>
            <Button variant="secondary" onClick={devBypass}>
              QPay-г алгасаад үр дүнг харах
            </Button>
          </div>
        )}
      </Card>

      <p className="mt-6 flex items-start justify-center gap-2 text-center text-xs leading-relaxed text-ink-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        Төлбөрийг манай сервер QPay-ээс шууд баталгаажуулдаг. Та хуудсаа хаасан ч дараа нь энэ холбоосоор буцаж орж болно.
      </p>
    </div>
  )
}

import { Printer, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ReportView } from '../components/report/ReportView'
import { Button, ButtonLink } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Card'
import { ErrorView, LoadingView } from '../components/ui/StateView'
import { track } from '../lib/analytics'
import { api, ApiError, isValidToken, type RelationshipReport, type ReportState } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { storage } from '../lib/storage'

const POLL_INTERVAL_MS = 4000

type State =
  | { kind: 'loading' }
  | { kind: 'generating' }
  | { kind: 'ready'; report: RelationshipReport; createdAt: string }
  | { kind: 'failed'; message: string; canRetry: boolean }
  | { kind: 'error'; title: string; message: string }

const GENERATING_MESSAGES = [
  'Таны хариултуудыг чиглэл бүрээр нь уншиж байна…',
  'Давуу талуудыг тодорхойлж байна…',
  'Хэв маягуудыг холбон харж байна…',
  'Яриа эхлүүлэх санаануудыг бэлтгэж байна…',
]

export function ReportPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [messageIndex, setMessageIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const apply = useCallback(
    (result: ReportState) => {
      if (result.status === 'completed') {
        setState({ kind: 'ready', report: result.report, createdAt: result.created_at })
        track({ name: 'report_viewed' })
      } else {
        setState({ kind: 'generating' })
      }
    },
    [],
  )

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError) {
        if (e.code === 'payment_required') return navigate(`/payment/${token}`, { replace: true })
        if (e.code === 'report_generation_failed' || e.code === 'generation_limit_reached') {
          return setState({ kind: 'failed', message: friendlyError(e), canRetry: e.body.can_retry === true })
        }
        if (e.status === 404) {
          return setState({ kind: 'error', title: 'Тайлан олдсонгүй', message: friendlyError(e) })
        }
      }
      setState({ kind: 'error', title: 'Тайланг ачаалж чадсангүй', message: friendlyError(e) })
    },
    [navigate, token],
  )

  const generate = useCallback(() => {
    if (!isValidToken(token)) return
    setState({ kind: 'generating' })
    api.generateReport(token).then(apply).catch(handleError)
  }, [token, apply, handleError])

  // Initial load: a paid-but-not-generated report triggers generation (safe to repeat — the backend is idempotent).
  useEffect(() => {
    if (!isValidToken(token)) return
    storage.saveAssessment(token)
    let active = true
    api
      .getReport(token)
      .then((result) => {
        if (!active) return
        if (result.status === 'paid') generate()
        else apply(result)
      })
      .catch((e) => active && handleError(e))
    return () => {
      active = false
    }
  }, [token, apply, generate, handleError])

  // Poll while generating (queue mode), and rotate the reassuring messages.
  useEffect(() => {
    if (state.kind !== 'generating' || !isValidToken(token)) return
    const poll = window.setInterval(() => {
      api
        .getReport(token)
        .then((r) => r.status === 'completed' && apply(r))
        .catch(handleError)
    }, POLL_INTERVAL_MS)
    const rotate = window.setInterval(() => setMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length), 3500)
    return () => {
      window.clearInterval(poll)
      window.clearInterval(rotate)
    }
  }, [state.kind, token, apply, handleError])

  async function deleteReport() {
    if (!isValidToken(token)) return
    if (!window.confirm('Та тайлан болон бүх хариултаа бүрмөсөн устгахдаа итгэлтэй байна уу? Үүнийг буцаах боломжгүй.')) return
    setDeleting(true)
    try {
      await api.deleteAssessment(token)
      storage.clearAll()
      track({ name: 'assessment_deleted' })
      navigate('/', { replace: true })
    } catch (e) {
      setDeleting(false)
      window.alert(friendlyError(e))
    }
  }

  if (!isValidToken(token)) {
    return <ErrorView title="Холбоос буруу байна" message="Энэ тайлангийн холбоос хүчингүй байна." action={<ButtonLink to="/">Нүүр хуудас</ButtonLink>} />
  }

  switch (state.kind) {
    case 'loading':
      return <LoadingView title="Тайланг ачаалж байна…" />
    case 'generating':
      return (
        <LoadingView
          title="Таны тайланг бэлтгэж байна"
          message={`${GENERATING_MESSAGES[messageIndex]} Энэ нь ихэвчлэн 30–60 секунд үргэлжилнэ.`}
        />
      )
    case 'failed':
      return (
        <ErrorView
          title="Тайлан үүсгэж чадсангүй"
          message={state.message}
          action={
            state.canRetry && (
              <Button onClick={generate}>
                <RefreshCw className="size-4" /> Дахин оролдох
              </Button>
            )
          }
        />
      )
    case 'error':
      return (
        <ErrorView
          title={state.title}
          message={state.message}
          action={
            <>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="size-4" /> Дахин ачаалах
              </Button>
              <ButtonLink to="/" variant="quiet">
                Нүүр хуудас
              </ButtonLink>
            </>
          }
        />
      )
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] glow-warm" />
      <div className="relative mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
        <header className="mb-10 text-center animate-fade-up">
          <Eyebrow>Soulmate Check</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Таны харилцааны тайлан</h1>
          <p className="mx-auto mt-4 max-w-lg text-ink-soft">
            Энэ тайлан зөвхөн таны хариултад үндэслэсэн бөгөөд таны өнөөгийн мэдрэмж, өнцгийг тусгана.
          </p>
        </header>

        <ReportView report={state.report} createdAt={state.createdAt} />

        <aside className="mt-16 rounded-3xl bg-sand/70 p-6 text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Анхааруулга</p>
          <p className="mt-2">
            Энэхүү тайланг хиймэл оюун ухаан зөвхөн таны өгсөн хариултад үндэслэн үүсгэсэн бөгөөд мэдээллийн чанартай. Энэ
            нь мэргэжлийн харилцааны зөвлөгөө, сэтгэл зүйн эсвэл эмнэлзүйн үнэлгээ биш юм. Хэрэв та өөрийгөө аюулгүй бус
            гэж мэдэрч байвал итгэдэг хүн эсвэл мэргэжлийн байгууллагад хандаарай.
          </p>
        </aside>

        <div className="no-print mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> Хэвлэх / PDF хадгалах
          </Button>
          <Button variant="ghost" onClick={deleteReport} loading={deleting}>
            <Trash2 className="size-4" /> Тайлангаа устгах
          </Button>
        </div>
        <p className="no-print mt-4 text-center text-xs text-ink-muted">
          Энэ хуудасны холбоосыг хадгалж аваарай — тайлан руу дахин орохын тулд хэрэгтэй.
        </p>
      </div>
    </div>
  )
}

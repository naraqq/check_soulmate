import { Compass, HelpCircle, Leaf, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AnalyzingView } from '../components/teaser/AnalyzingView'
import { ShareCta } from '../components/share/ShareCta'
import { PaywallCard } from '../components/teaser/PaywallCard'
import { TeaserList } from '../components/teaser/TeaserList'
import { Button, ButtonLink } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Card'
import { RetestButton } from '../components/ui/RetestButton'
import { LoadingView } from '../components/ui/StateView'
import { loadLoveStyle, loveStyleFor, saveLoveStyle } from '../data/loveStyles'
import { QUESTIONNAIRE_VERSION, questions } from '../data/questions'
import { trackFor } from '../data/track'
import type { Track } from '../data/types'
import { visibleAnswers } from '../data/visibility'
import { buildTeaser } from '../lib/analysis/teaser'
import { getAttribution, track } from '../lib/analytics'
import { api, ApiError, type AssessmentSummary } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { storage } from '../lib/storage'

interface TeaserTitles {
  strengths: string[]
  explore: string[]
  attention: string | null
}

export function CompletePage() {
  const navigate = useNavigate()
  const progress = useMemo(() => storage.loadProgress(QUESTIONNAIRE_VERSION), [])
  const [stored, setStored] = useState(() => storage.loadAssessment())
  const [remote, setRemote] = useState<AssessmentSummary | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [comparisonToken, setComparisonToken] = useState(() => storage.loadComparisonToken())
  const [comparisonUnavailable, setComparisonUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Straight from the last question: show the short "understanding you" moment first.
  const location = useLocation()
  const [analyzing, setAnalyzing] = useState(() => (location.state as { justFinished?: boolean } | null)?.justFinished === true)
  const finishAnalyzing = useCallback(() => {
    setAnalyzing(false)
    navigate('.', { replace: true, state: null }) // don't replay on refresh
  }, [navigate])

  const localTeaser = useMemo(
    () => (progress?.completed ? buildTeaser(questions, visibleAnswers(questions, progress.answers)) : null),
    [progress],
  )

  // The shareable love style: worked out from this device's answers, remembered for the report page.
  const loveStyle = useMemo(() => {
    if (!progress?.completed) return loadLoveStyle()
    const answers = visibleAnswers(questions, progress.answers)
    return loveStyleFor(questions, answers, trackFor(answers))
  }, [progress])
  useEffect(() => {
    if (loveStyle) saveLoveStyle(loveStyle.id)
  }, [loveStyle])

  // If already submitted, ask the backend where this assessment stands.
  useEffect(() => {
    if (!stored) return
    let active = true
    api
      .getAssessment(stored.token)
      .then((summary) => active && setRemote(summary))
      .catch((e) => {
        if (!active) return
        if (e instanceof ApiError && e.status === 404) {
          storage.clearAssessment() // deleted or expired — allow resubmission
          setStored(null)
        }
      })
    return () => {
      active = false
    }
  }, [stored])

  useEffect(() => {
    track({ name: 'paywall_viewed' })
  }, [])

  if (!stored && !progress?.completed) return <Navigate to="/check" replace />
  if (analyzing) return <AnalyzingView onDone={finishAnalyzing} />
  if (stored && !localTeaser && !remote) return <LoadingView title="Ачаалж байна…" />

  const teaser: TeaserTitles = localTeaser
    ? {
        strengths: localTeaser.strengths.map((t) => t.title),
        explore: localTeaser.explore.map((t) => t.title),
        attention: localTeaser.attention?.title ?? null,
      }
    : remote!.teaser
  const flow: Track = progress?.completed ? trackFor(progress.answers) : (remote?.track ?? 'couple')

  const alreadyPaid = remote?.paid ?? false

  async function unlock() {
    setError(null)
    if (stored) {
      navigate(`/payment/${stored.token}`)
      return
    }
    if (!progress || !localTeaser) return

    setSubmitting(true)
    try {
      const { token } = await api.createAssessment({
        questionnaire_version: QUESTIONNAIRE_VERSION,
        previous_assessment_token: comparisonToken,
        answers: visibleAnswers(questions, progress.answers),
        teaser: {
          strengths: localTeaser.strengths.map((t) => t.id),
          explore: localTeaser.explore.map((t) => t.id),
          attention: localTeaser.attention?.id ?? null,
        },
        // The server records "checkout started" (and later the verified payment) against this.
        attribution: getAttribution(),
      })
      storage.saveAssessment(token)
      storage.clearComparisonToken()
      navigate(`/payment/${token}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && (e.body.errors as Record<string, unknown> | undefined)?.previous_assessment_token) {
        setComparisonUnavailable(true)
        setError('Өмнөх шалгалт олдсонгүй. Харьцуулалтгүйгээр үргэлжлүүлж болно.')
      } else setError(friendlyError(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[480px] glow-warm" />
      {comparisonUnavailable && (
        <div role="alert" className="mx-auto max-w-2xl px-4 pt-8">
          <p>Өмнөх шалгалт устсан эсвэл ашиглах боломжгүй байна.</p>
          <Button onClick={() => { storage.clearComparisonToken(); setComparisonToken(null); setComparisonUnavailable(false); setError(null) }}>Харьцуулалтгүй үргэлжлүүлэх</Button>
        </div>
      )}
      <div className="relative mx-auto max-w-2xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
        <div className="animate-fade-up text-center">
          <Eyebrow>Шалгалт дууслаа</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold text-balance sm:text-5xl">
            Таны харилцааны шалгалт дууслаа
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">Таны хариултуудаас бид дараах зүйлсийг анзаарлаа:</p>
        </div>

        <div className="mt-10 space-y-8 animate-fade-up [animation-delay:120ms]">
          {flow === 'early' && (
            <TeaserList heading="Таны гол асуулт" items={['Энэ харилцаа ирээдүйтэй юу?']} tone="clay" icon={HelpCircle} />
          )}
          <TeaserList heading="Боломжит давуу талууд" items={teaser.strengths} tone="sage" icon={Leaf} />
          <TeaserList heading="Судлах нь зүйтэй чиглэлүүд" items={teaser.explore} tone="dusk" icon={Compass} />
          <TeaserList
            heading="Анхаарал хандуулах нь зүйтэй хэв маяг"
            items={teaser.attention ? [teaser.attention] : []}
            tone="clay"
            icon={Sparkles}
          />
        </div>

        <div className="mt-12 animate-fade-up [animation-delay:240ms]">
          {alreadyPaid && stored ? (
            <div className="rounded-4xl bg-paper p-8 text-center shadow-lift">
              <h2 className="font-display text-2xl font-semibold">Таны тайлан нээгдсэн байна</h2>
              <ButtonLink to={`/report/${stored.token}`} size="lg" className="mt-6">
                Тайлангаа харах
              </ButtonLink>
            </div>
          ) : (
            <>
              <p className="mb-5 text-center font-display text-xl font-semibold">Таны бүрэн, хувийн тайлан бэлэн боллоо.</p>
              <PaywallCard track={flow} onUnlock={unlock} loading={submitting} error={error} />
            </>
          )}
        </div>

        {/* Everyone who finishes gets their love style and can share it — not just payers. */}
        <ShareCta placement="teaser" flow={flow} loveStyle={loveStyle} className="mt-10" />

        <div className="mt-8 flex flex-col items-center gap-3 text-sm text-ink-muted">
          <RetestButton
            variant="ghost"
            label="Шинээр эхлэх"
            confirmMessage={alreadyPaid ? undefined : 'Шинээр эхлэх үү? Одоогийн хариултууд тань энэ төхөөрөмжөөс арилна.'}
          />
          <Link to="/privacy" className="hover:text-ink hover:underline">
            Таны мэдээллийг хэрхэн хамгаалдаг вэ?
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Compass, Leaf, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { AnalyzingView } from '../components/teaser/AnalyzingView'
import { PaywallCard } from '../components/teaser/PaywallCard'
import { TeaserList } from '../components/teaser/TeaserList'
import { ButtonLink } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Card'
import { LoadingView } from '../components/ui/StateView'
import { QUESTIONNAIRE_VERSION, questions } from '../data/questions'
import { visibleAnswers } from '../data/visibility'
import { buildTeaser } from '../lib/analysis/teaser'
import { track } from '../lib/analytics'
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
        answers: visibleAnswers(questions, progress.answers),
        teaser: {
          strengths: localTeaser.strengths.map((t) => t.id),
          explore: localTeaser.explore.map((t) => t.id),
          attention: localTeaser.attention?.id ?? null,
        },
      })
      storage.saveAssessment(token)
      track({ name: 'check_completed', props: { answered: localTeaser.answeredCount, skipped: localTeaser.skippedCount } })
      navigate(`/payment/${token}`)
    } catch (e) {
      setError(friendlyError(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[480px] glow-warm" />
      <div className="relative mx-auto max-w-2xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
        <div className="animate-fade-up text-center">
          <Eyebrow>Шалгалт дууслаа</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold text-balance sm:text-5xl">
            Таны харилцааны шалгалт дууслаа
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">Таны хариултуудаас бид дараах зүйлсийг анзаарлаа:</p>
        </div>

        <div className="mt-10 space-y-8 animate-fade-up [animation-delay:120ms]">
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
              <PaywallCard onUnlock={unlock} loading={submitting} error={error} />
            </>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-sm text-ink-muted">
          <Link to="/privacy" className="hover:text-ink hover:underline">
            Таны мэдээллийг хэрхэн хамгаалдаг вэ?
          </Link>
        </div>
      </div>
    </div>
  )
}

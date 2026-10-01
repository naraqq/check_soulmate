import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { QuestionView } from '../components/questionnaire/QuestionView'
import { SectionIntro } from '../components/questionnaire/SectionIntro'
import { Button } from '../components/ui/Button'
import { categories, questions } from '../data/questions'
import { audienceParam, STAGE_QUESTION, stageFitsAudience, trackFor } from '../data/track'
import { isVisible, optionsFor, visibleAnswers } from '../data/visibility'
import { useQuestionnaire } from '../hooks/useQuestionnaire'
import { sectionMood } from '../lib/analysis/teaser'
import { track } from '../lib/analytics'
import { storage } from '../lib/storage'

/** A warm phrase instead of "question 12 / 43". */
function encouragementFor(progress: number): string {
  if (progress < 0.12) return 'Эхэлцгээе'
  if (progress < 0.4) return 'Сайн явж байна'
  if (progress < 0.6) return 'Тал хүрлээ'
  if (progress < 0.85) return 'Үлдсэн нь бага'
  return 'Бараг дууслаа'
}

export function CheckPage() {
  const navigate = useNavigate()
  // Came through a landing-page door (?for=early / ?for=couple): offer only that audience's stages.
  const audience = audienceParam(useSearchParams()[0].get('for'))
  const [allStages, setAllStages] = useState(false)
  const q = useQuestionnaire(questions)
  const [comparisonToken, setComparisonToken] = useState(() => storage.loadComparisonToken())
  const startedTracked = useRef(false)
  // The question the user just tapped an answer on (so we don't flash a "next" button during auto-advance).
  const [selectedHere, setSelectedHere] = useState<string | null>(null)

  // Only the sections of this user's flow (early stage vs. couple) — decided by the stage question.
  const sections = useMemo(
    () => categories.filter((c) => questions.some((x) => x.category === c.id && isVisible(x, q.answers))),
    [q.answers],
  )
  const category = useMemo(() => categories.find((c) => c.id === q.question.category)!, [q.question.category])
  const categoryIndex = sections.indexOf(category)
  const sectionQuestions = questions.filter((x) => x.category === category.id && isVisible(x, q.answers))
  const sectionProgress = q.showIntro ? 0 : sectionQuestions.indexOf(q.question) / sectionQuestions.length
  const overall = (categoryIndex + sectionProgress) / sections.length
  const encouragement = encouragementFor(overall)

  // Reflection on the section just completed, shown on the next section's intro.
  const finishedCat = q.finishedCategory ? categories.find((c) => c.id === q.finishedCategory) : undefined
  const finished = finishedCat
    ? { label: finishedCat.label, reflection: finishedCat.outro[sectionMood(finishedCat.id, questions, visibleAnswers(questions, q.answers))] }
    : undefined

  useEffect(() => {
    if (!startedTracked.current && q.position === 0 && Object.keys(q.answers).length === 0) {
      track({ name: 'check_started' })
      startedTracked.current = true
    }
  }, [q.position, q.answers])

  // Only a finish that happens here counts — not a restored, already finished check.
  const finishedBefore = useRef(q.completed)
  useEffect(() => {
    if (!q.completed) return
    if (!finishedBefore.current) {
      finishedBefore.current = true
      track({ name: 'check_completed', props: { track: trackFor(q.answers) } })
    }
    navigate('/complete', { state: { justFinished: true } })
  }, [q.completed, q.answers, navigate])

  // Already submitted on this device — the answers are locked.
  if (storage.loadAssessment()) return <Navigate to="/complete" replace />

  // The stage question lists only the chosen audience's stages, unless the user asks for all.
  const narrowStages = q.question.id === STAGE_QUESTION && audience !== null && !allStages
  const isText = q.question.type === 'text'
  const answeredCurrent = q.value !== null && q.value !== ''
  // The reply bubble has its own "continue" button, so the bottom one steps aside.
  const showingReply = Boolean(q.question.options?.find((o) => o.value === q.value)?.reply)
  const showForward = isText || (answeredCurrent && !showingReply && selectedHere !== q.question.id)

  function goBack() {
    setSelectedHere(null) // the answer we return to was chosen earlier, so offer "Дараах" for it
    q.back()
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-12">
      {comparisonToken && (
        <div className="mb-6 rounded-2xl border border-line bg-paper p-4 text-sm">
          <p>Энэ удаагийн хариултыг ижил хүнтэй холбоотой өмнөх шалгалттай харьцуулна. Одоогийн байдлаар хариулаарай.</p>
          <Button variant="quiet" onClick={() => { storage.clearComparisonToken(); setComparisonToken(null) }}>Харьцуулахгүй</Button>
        </div>
      )}
      {/* Journey — one segment per section, no question counting */}
      <div className="mb-10" role="progressbar" aria-label="Явц" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(overall * 100)}>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-ink">{category.label}</span>
          <span key={encouragement} className="text-ink-muted animate-fade-in">
            {encouragement}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {sections.map((c, i) => (
            <span key={c.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-violet-400 via-pink-400 to-yellow-300 transition-[width] duration-700 ease-out"
                style={{ width: `${i < categoryIndex ? 100 : i === categoryIndex ? sectionProgress * 100 : 0}%` }}
              />
            </span>
          ))}
        </div>
      </div>

      {q.showIntro ? (
        <div className="flex-1">
          <SectionIntro
            key={category.id}
            category={category}
            section={categoryIndex + 1}
            sections={sections.length}
            questionCount={sectionQuestions.length}
            finished={finished}
            onStart={q.dismissIntro}
          />
          {q.canGoBack && (
            <div className="mt-8">
              <BackButton onClick={goBack} />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1">
            <QuestionView
              key={q.question.id}
              question={{
                ...q.question,
                options: optionsFor(q.question, q.answers)?.filter((o) => !narrowStages || stageFitsAudience(o.value, audience!)),
              }}
              value={q.value}
              onSelect={(value) => {
                setSelectedHere(q.question.id)
                q.setAnswer(value, { autoAdvance: true })
              }}
              onTextChange={(value) => q.setAnswer(value)}
              onContinue={q.next}
            />
            {narrowStages && (
              <button type="button" onClick={() => setAllStages(true)} className="mt-4 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                Өөр шат харах
              </button>
            )}
          </div>

          {/*
            Forward only when needed: finish the optional reflection (may be left empty), or continue an
            answer restored after a refresh or a step back. Never shown right after a tap — that auto-advances.
          */}
          {(q.canGoBack || showForward) && (
            <div className="mt-8 flex items-center justify-between gap-3">
              {q.canGoBack ? <BackButton onClick={goBack} /> : <span />}
              {showForward &&
                (isText ? (
                  <Button size="lg" onClick={q.next} className="flex-1 sm:flex-none">
                    Дуусгах <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={q.next} className="flex-1 sm:flex-none">
                    Дараах <ArrowRight className="size-4" />
                  </Button>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" onClick={onClick} aria-label="Өмнөх асуулт">
      <ArrowLeft className="size-4" /> Буцах
    </Button>
  )
}

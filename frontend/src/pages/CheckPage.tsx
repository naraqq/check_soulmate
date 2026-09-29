import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { QuestionView } from '../components/questionnaire/QuestionView'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { categories, questions } from '../data/questions'
import { useQuestionnaire } from '../hooks/useQuestionnaire'
import { track } from '../lib/analytics'
import { storage } from '../lib/storage'

export function CheckPage() {
  const navigate = useNavigate()
  const q = useQuestionnaire(questions)
  const startedTracked = useRef(false)

  const categoryLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [])
  const categoryOrder = useMemo(() => categories.map((c) => c.id), [])
  const currentCategoryIndex = categoryOrder.indexOf(q.question.category)

  useEffect(() => {
    if (!startedTracked.current && q.index === 0 && Object.keys(q.answers).length === 0) {
      track({ name: 'check_started' })
      startedTracked.current = true
    }
  }, [q.index, q.answers])

  useEffect(() => {
    if (q.completed) navigate('/complete')
  }, [q.completed, navigate])

  // Already submitted on this device — the answers are locked.
  if (storage.loadAssessment()) return <Navigate to="/complete" replace />

  const isText = q.question.type === 'text'
  const answeredCurrent = q.value !== null && q.value !== ''

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-xl flex-col px-4 pt-6 pb-8 sm:px-6 sm:pt-10">
      {/* Progress */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>
            Асуулт <span className="font-semibold text-ink">{q.index + 1}</span> / {q.total}
          </span>
          <span className="hidden sm:inline">
            {currentCategoryIndex + 1}-р хэсэг / {categoryOrder.length}
          </span>
        </div>
        <ProgressBar value={(q.index + (answeredCurrent ? 1 : 0)) / q.total} label="Асуумжийн явц" />
        <div className="flex gap-1.5" aria-hidden>
          {categoryOrder.map((id, i) => (
            <span
              key={id}
              className={`h-1 flex-1 rounded-full transition-colors ${i < currentCategoryIndex ? 'bg-sage' : i === currentCategoryIndex ? 'bg-clay/70' : 'bg-line'}`}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <QuestionView
          key={q.question.id}
          question={q.question}
          categoryLabel={categoryLabels[q.question.category]}
          value={q.value}
          onSelect={(value) => q.setAnswer(value, { autoAdvance: true })}
          onTextChange={(value) => q.setAnswer(value)}
        />
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 mt-10 -mx-4 flex items-center justify-between gap-3 bg-gradient-to-t from-cream via-cream to-cream/0 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-none sm:px-0">
        <Button variant="ghost" onClick={q.back} disabled={q.isFirst} aria-label="Өмнөх асуулт">
          <ArrowLeft className="size-4" /> Буцах
        </Button>

        {isText ? (
          <div className="flex items-center gap-2">
            {!answeredCurrent && (
              <Button variant="quiet" onClick={q.skip}>
                Алгасах
              </Button>
            )}
            <Button onClick={q.next} disabled={!answeredCurrent}>
              Дуусгах <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : answeredCurrent ? (
          <Button variant="secondary" onClick={q.next}>
            Дараах <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button variant="quiet" onClick={q.skip}>
            Алгасах
          </Button>
        )}
      </div>

      {q.index > 0 && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Бүх хариултаа устгаж, шинээр эхлэх үү?')) q.restart()
            }}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <RotateCcw className="size-3" /> Шинээр эхлэх
          </button>
        </div>
      )}
    </div>
  )
}

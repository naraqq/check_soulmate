import { ArrowRight } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { Question } from '../../data/types'
import { LemonMark } from '../layout/LemonMark'
import { Button } from '../ui/Button'
import { OptionList } from './OptionList'

interface Props {
  question: Question
  value: string | null
  onSelect: (value: string) => void
  onTextChange: (value: string) => void
  /** Move on after reading a reply. */
  onContinue: () => void
}

export function QuestionView({ question, value, onSelect, onTextChange, onContinue }: Props) {
  const headingId = useId()
  const isText = question.type === 'text'
  const reply = question.options?.find((o) => o.value === value)?.reply
  const replyRef = useRef<HTMLDivElement>(null)

  // On phones the reply can appear below the fold — bring it into view.
  useEffect(() => {
    if (reply) replyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [reply])

  // Number keys pick options on desktop.
  useEffect(() => {
    if (isText || !question.options) return
    const options = question.options
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= options.length) onSelect(options[n - 1].value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isText, question.options, onSelect])

  return (
    <section key={question.id} className="animate-fade-up" aria-live="polite">
      <h1 id={headingId} className="font-display text-[1.4rem] leading-snug font-semibold text-balance sm:text-3xl">
        {question.text}
      </h1>
      {question.helper && <p className="mt-3 text-[15px] text-ink-soft">{question.helper}</p>}

      <div className="mt-8">
        {isText ? (
          <div>
            <textarea
              aria-labelledby={headingId}
              value={value ?? ''}
              onChange={(e) => onTextChange(e.target.value)}
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              rows={6}
              className="w-full resize-none rounded-2xl border border-line bg-paper p-4 text-base leading-relaxed shadow-soft placeholder:text-ink-muted focus:border-ink/30 focus:outline-none"
            />
            {question.maxLength && (
              <p className="mt-2 text-right text-xs text-ink-muted">
                {(value ?? '').length} / {question.maxLength}
              </p>
            )}
          </div>
        ) : (
          <OptionList
            options={question.options ?? []}
            type={question.type}
            value={value}
            onSelect={onSelect}
            labelledBy={headingId}
          />
        )}
      </div>

      {reply && (
        <div key={reply} ref={replyRef} role="status" className="mt-5 scroll-mb-28 animate-fade-up">
          <div className="flex items-start gap-3">
            <LemonMark className="mt-0.5 size-8 shrink-0" />
            <p className="rounded-3xl rounded-tl-md border border-line bg-paper px-4 py-3 text-[15px] leading-relaxed backdrop-blur">
              {reply}
            </p>
          </div>
          <div className="mt-4 pl-11">
            <Button onClick={onContinue} autoFocus>
              Үргэлжлүүлэх <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

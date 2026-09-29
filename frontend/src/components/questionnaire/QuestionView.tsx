import { useEffect, useId } from 'react'
import type { Question } from '../../data/types'
import { OptionList } from './OptionList'

interface Props {
  question: Question
  categoryLabel: string
  value: string | null
  onSelect: (value: string) => void
  onTextChange: (value: string) => void
}

export function QuestionView({ question, categoryLabel, value, onSelect, onTextChange }: Props) {
  const headingId = useId()
  const isText = question.type === 'text'

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
      <p className="mb-3 text-sm font-semibold text-clay">{categoryLabel}</p>
      <h1 id={headingId} className="font-display text-[1.65rem] leading-snug font-semibold text-balance sm:text-3xl">
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
    </section>
  )
}

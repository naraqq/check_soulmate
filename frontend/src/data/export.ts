import { categories, QUESTIONNAIRE_VERSION, questions } from './questions'
import { signalCatalog } from './signals'
import { EARLY_STAGES, STAGE_QUESTION } from './track'

/** Shape consumed by backend/app/Services/Questionnaire.php. */
export function buildQuestionnaireExport() {
  return {
    version: QUESTIONNAIRE_VERSION,
    // Which answers put the user on the early-stage track (see data/track.ts).
    tracks: { stage_question: STAGE_QUESTION, early_stages: EARLY_STAGES },
    categories: categories.map(({ id, label }) => ({ id, label })),
    questions: questions.map((q) => ({
      id: q.id,
      category: q.category,
      text: q.text,
      type: q.type,
      optional: q.optional ?? false,
      max_length: q.maxLength ?? null,
      analysis_tags: q.analysisTags,
      show_if: q.showIf ? { question: q.showIf.question, in: q.showIf.in ?? null, not_in: q.showIf.notIn ?? null } : null,
      visible_when: (q.visibleWhen ?? []).map((rule) => ({ question: rule.question, in: rule.in ?? null, not_in: rule.notIn ?? null })),
      options: (q.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
        ...(o.flag ? { flag: o.flag } : {}),
      })),
    })),
    signals: signalCatalog(),
  }
}

import { categories, QUESTIONNAIRE_VERSION, questions } from './questions'
import { signalCatalog } from './signals'

/** Shape consumed by backend/app/Services/Questionnaire.php. */
export function buildQuestionnaireExport() {
  return {
    version: QUESTIONNAIRE_VERSION,
    categories: categories.map(({ id, label }) => ({ id, label })),
    questions: questions.map((q) => ({
      id: q.id,
      category: q.category,
      text: q.text,
      type: q.type,
      optional: q.optional ?? false,
      max_length: q.maxLength ?? null,
      analysis_tags: q.analysisTags,
      options: (q.options ?? []).map((o) => ({
        value: o.value,
        label: o.label,
        ...(o.flag ? { flag: o.flag } : {}),
      })),
    })),
    signals: signalCatalog(),
  }
}

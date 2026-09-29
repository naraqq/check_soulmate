/**
 * Exports the questionnaire (the single source of truth in src/data) to JSON
 * for the Laravel backend, which uses it to validate submitted answers and to
 * describe answers to the AI using trusted question/option text.
 *
 *   npm run export:questions
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildQuestionnaireExport } from '../src/data/export.ts'

const here = dirname(fileURLToPath(import.meta.url))
const target = resolve(here, '../../backend/resources/questionnaire/questions.json')

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(buildQuestionnaireExport(), null, 2) + '\n', 'utf8')

console.log(`Questionnaire exported to ${target}`)

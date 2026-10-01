import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ReportView } from '../components/report/ReportView'
import type { RelationshipReport } from '../lib/api'
import { CheckPage } from './CheckPage'
import { LandingPage } from './LandingPage'
import { PaymentPage } from './PaymentPage'
import { PrivacyPage } from './PrivacyPage'
import { ReportPage } from './ReportPage'
import { TermsPage } from './TermsPage'

/** Smoke tests: every route renders without throwing (effects don't run server-side). */
function render(path: string, url: string, element: ReactElement) {
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path={path} element={element} />
      </Routes>
    </MemoryRouter>,
  )
}

const token = 'a'.repeat(48)

describe('pages render', () => {
  it('landing', () => expect(render('/', '/', <LandingPage />)).toContain('Харилцаагаа илүү ойлгож,'))
  it('check', () => expect(render('/check', '/check', <CheckPage />)).toContain('Та хоёрын харилцаа одоо ямар шатандаа байна вэ?'))
  it('payment', () => expect(render('/payment/:token', `/payment/${token}`, <PaymentPage />)).toContain('Нэхэмжлэх'))
  it('payment with invalid token', () =>
    expect(render('/payment/:token', '/payment/123', <PaymentPage />)).toContain('Холбоос буруу'))
  it('report', () => expect(render('/report/:token', `/report/${token}`, <ReportPage />)).toContain('ачаалж'))
  it('privacy', () => expect(render('/privacy', '/privacy', <PrivacyPage />)).toContain('Нууцлалын бодлого'))
  it('terms', () => expect(render('/terms', '/terms', <TermsPage />)).toContain('Үйлчилгээний нөхцөл'))
})

describe('ReportView', () => {
  const section = {
    state: 'attention' as const,
    insight: 'Ойр дотно байдлыг хүсэх нь хэвийн хэрэгцээ.',
    healthy: 'Хоёулаа түрүүлж холбогддог.',
    steps: ['Нэгдүгээр алхам.', 'Хоёрдугаар алхам.'],
    try_saying: 'Чамаас мессеж ирэхэд би баярладаг.',
  }
  const report: RelationshipReport = {
    headline: 'Дулаан суурь',
    summary: 'Дүгнэлт',
    note_to_you: 'Таны мэдэрч буй зүйл ойлгомжтой.',
    action_plan: [{ title: 'Эхний алхам', description: 'Тайлбар' }],
    self_care: ['Өөртөө цаг гаргаарай.'],
    strengths: [{ title: 'Итгэл', description: 'Тайлбар' }],
    areas_to_explore: [{ title: 'Тэнцвэр', description: 'Тайлбар', importance: 'high' }],
    communication: section,
    affection: section,
    // Varied states, so the overview's grouping and order are exercised.
    effort: { ...section, state: 'strength' },
    trust: { ...section, state: 'mixed' },
    conflict: section,
    independence: section,
    future: section,
    patterns: [{ title: 'Санаачлага', description: 'Тайлбар' }],
    conversation_starters: ['Бид ярилцаж болох уу?'],
    closing: 'Төгсгөл',
  }

  it('renders every report section without raw JSON or percentages', () => {
    const html = render('/', '/', <ReportView report={report} createdAt="2026-09-29T00:00:00Z" />)
    for (const heading of [
      'Танд хэлэх үг',
      'Та хоёрын давуу талууд',
      'Та хоёрын харилцааны гол хэв маяг',
      'Ирээдүйн нийцэл',
      'Ирэх 7 хоногт',
      'Өөртөө анхаарал тавих нь',
      'Хамтрагчтайгаа ярилцах асуултууд',
    ]) {
      expect(html).toContain(heading)
    }
    expect(html).not.toContain('{&quot;')
    expect(html).not.toMatch(/\d+%/)
  })

  it('gives every topic insight, a healthy picture, steps and words to say', () => {
    const html = render('/', '/', <ReportView report={report} createdAt="2026-09-29T00:00:00Z" />)
    expect(html).toContain('Харилцаа тань чиглэл бүрээр')
    expect(html).toContain('Анхаарах хэрэгтэй')
    // Plain labels, in reading order: what needs attention comes before what's going well.
    expect(html.indexOf('Анхаарах хэрэгтэй')).toBeLessThan(html.indexOf('Дунд зэрэг'))
    expect(html.indexOf('Дунд зэрэг')).toBeLessThan(html.indexOf('Сайн байгаа'))
    // Detailed cards follow the same order: a strength topic comes after the attention ones.
    expect(html.indexOf('id="topic-communication"')).toBeLessThan(html.indexOf('id="topic-effort"'))
    expect(html).not.toContain('Холимог')
    expect(html.match(/Эрүүл харилцаанд ийм байдаг/g)).toHaveLength(7)
    expect(html.match(/Юу хийж болох вэ/g)).toHaveLength(7)
    expect(html.match(/Ингэж хэлээд үзээрэй/g)).toHaveLength(7)
    expect(html).toContain('href="#topic-trust"')
  })

  it('still renders older reports (summary/observations/tip, no note or plan)', () => {
    const legacy = { summary: 'Товч.', observations: ['Ажиглалт.'], tip: 'Зөвлөгөө.' }
    const old: RelationshipReport = {
      ...report,
      note_to_you: undefined,
      action_plan: undefined,
      self_care: undefined,
      communication: legacy,
      affection: legacy,
      effort: legacy,
      trust: legacy,
      conflict: legacy,
      independence: legacy,
      future: legacy,
    }
    const html = render('/', '/', <ReportView report={old} createdAt="2026-09-29T00:00:00Z" />)
    expect(html).toContain('Ажиглалт.')
    expect(html).toContain('Туршиж үзэх зүйл')
    expect(html).not.toContain('Танд хэлэх үг')
    expect(html).not.toContain('Ирэх 7 хоногт')
  })
})

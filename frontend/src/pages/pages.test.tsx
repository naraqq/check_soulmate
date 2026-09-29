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
  it('landing', () => expect(render('/', '/', <LandingPage />)).toContain('санагддаг вэ?'))
  it('check', () => expect(render('/check', '/check', <CheckPage />)).toContain('Та хоёр хэр удаан хамт байгаа вэ?'))
  it('payment', () => expect(render('/payment/:token', `/payment/${token}`, <PaymentPage />)).toContain('Нэхэмжлэх'))
  it('payment with invalid token', () =>
    expect(render('/payment/:token', '/payment/123', <PaymentPage />)).toContain('Холбоос буруу'))
  it('report', () => expect(render('/report/:token', `/report/${token}`, <ReportPage />)).toContain('ачаалж'))
  it('privacy', () => expect(render('/privacy', '/privacy', <PrivacyPage />)).toContain('Нууцлалын бодлого'))
  it('terms', () => expect(render('/terms', '/terms', <TermsPage />)).toContain('Үйлчилгээний нөхцөл'))
})

describe('ReportView', () => {
  const section = { summary: 'Товч дүгнэлт.', observations: ['Ажиглалт.'] }
  const report: RelationshipReport = {
    headline: 'Дулаан суурь',
    summary: 'Дүгнэлт',
    strengths: [{ title: 'Итгэл', description: 'Тайлбар' }],
    areas_to_explore: [{ title: 'Тэнцвэр', description: 'Тайлбар', importance: 'high' }],
    communication: section,
    affection: section,
    effort: section,
    trust: section,
    conflict: section,
    independence: section,
    future: section,
    patterns: [{ title: 'Санаачлага', description: 'Тайлбар' }],
    conversation_starters: ['Бид ярилцаж болох уу?'],
    closing: 'Төгсгөл',
  }

  it('renders every report section without raw JSON or percentages', () => {
    const html = render('/', '/', <ReportView report={report} createdAt="2026-09-29T00:00:00Z" />)
    for (const heading of ['Давуу талууд', 'Ирээдүйн нийцэл', 'Бидний анзаарсан хэв маяг', 'Яриа эхлүүлэх санаанууд', 'Эцсийн бодрол']) {
      expect(html).toContain(heading)
    }
    expect(html).not.toContain('{&quot;')
    expect(html).not.toMatch(/\d+%/)
  })
})

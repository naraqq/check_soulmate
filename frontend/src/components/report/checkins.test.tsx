import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CheckInProgress } from './CheckInProgress'
import { EvidenceDetails } from './EvidenceDetails'
import { ReportFeedbackForm } from './ReportFeedbackForm'

describe('grounded check-in presentation', () => {
  it('shows what remains unknown without the evidence breakdown', () => {
    const html = renderToStaticMarkup(<EvidenceDetails uncertainty="<script>Still unknown</script>" />)
    expect(html).not.toContain('Энэ дүгнэлт юунд тулгуурлав?')
    expect(html).toContain('Still unknown')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(renderToStaticMarkup(<EvidenceDetails />)).toBe('')
  })

  it('shows missing information and cautions about overlapping check-ins', () => {
    const html = renderToStaticMarkup(<CheckInProgress comparison={{
      status: 'compared', previous_date: '2026-09-01T00:00:00Z', current_date: '2026-09-08T00:00:00Z',
      days_between: 7, stage_changed: true,
      items: [{ topic: 'effort', label: 'Effort', previous: null, current: 'Often', direction: 'not_comparable' }],
    }} />)
    expect(html).toContain('Харьцуулах мэдээлэл дутуу')
    expect(html).toContain('өдрүүд давхцаж болно')
    expect(html).toContain('Харилцааны шат өөрчлөгдсөн')
    expect(html).not.toContain('Илүү олон тохиолдож байна')
  })

  it('makes feedback optional and asks about understanding and next steps', () => {
    const html = renderToStaticMarkup(<ReportFeedbackForm token={'a'.repeat(48)} submitted={false} />)
    expect(html).toContain('Заавал биш')
    expect(html).toContain('нөхцөл байдлыг ойлгосон')
    expect(html).toContain('дараагийн алхам тодорхой')
    expect(html).not.toContain('<textarea')
    expect(renderToStaticMarkup(<ReportFeedbackForm token={'a'.repeat(48)} submitted />)).toContain('баярлалаа')
  })
})

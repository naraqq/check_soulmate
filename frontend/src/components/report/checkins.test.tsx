import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CheckInProgress } from './CheckInProgress'
import { EvidenceDetails } from './EvidenceDetails'

describe('grounded check-in presentation', () => {
  it('keeps uncertainty without the removed evidence panel', () => {
    const html = renderToStaticMarkup(<EvidenceDetails uncertainty="Still unknown <script>example</script>" />)
    expect(html).not.toContain('Энэ дүгнэлт юунд тулгуурлав?')
    expect(html).not.toContain('<details')
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

})

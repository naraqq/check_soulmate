import { beforeAll, describe, expect, it, vi } from 'vitest'
import { shareUrl, siteHost, strengthsCard } from './share'

// Tests run in Node: give the helpers a local-dev browser location.
beforeAll(() => {
  const location = new URL('http://localhost:5173/check')
  vi.stubGlobal('window', { location: { ...location, host: location.host, origin: location.origin } })
})

describe('shareUrl', () => {
  it('tags the landing page so the dashboard credits the share method', () => {
    const url = new URL(shareUrl('instagram_story', 'report'))
    expect(url.pathname).toBe('/')
    expect(Object.fromEntries(url.searchParams)).toEqual({ utm_source: 'share', utm_medium: 'instagram_story', utm_campaign: 'report' })
  })
})

describe('strengthsCard', () => {
  it('shows at most three strengths and nothing else from the check', () => {
    const card = strengthsCard('couple', ['A', ' B ', '', 'C', 'D'])
    expect(card.items).toEqual(['A', 'B', 'C'])
    expect(JSON.stringify(card)).not.toMatch(/анхаар|санаа зов/i)
  })

  it('speaks to people who are only getting to know someone', () => {
    expect(strengthsCard('early', ['A']).cta).toContain('ирээдүйтэй')
  })

  it('still makes a card when there are no strengths', () => {
    expect(strengthsCard('couple', []).title).toBe('Би харилцаагаа гаднаас нь харлаа')
  })
})

describe('siteHost', () => {
  it('prints the brand domain instead of localhost', () => {
    expect(siteHost()).toBe('lemony.mn')
  })
})

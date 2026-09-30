import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOVE_STYLES } from '../data/loveStyles'
import { inviteText, loveStyleCard, messengerTarget, shareUrl, siteHost } from './share'

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


  it('sends friends to the matching landing page', () => {
    expect(new URL(shareUrl('messenger', 'teaser', 'early')).searchParams.get('for')).toBe('early')
  })
})

describe('loveStyleCard', () => {
  it('is about the person — their type and traits, nothing about a relationship', () => {
    const card = loveStyleCard(LOVE_STYLES.carer)
    expect(card.title).toBe('Халамжлагч')
    expect(card.items).toHaveLength(3)
    expect(JSON.stringify(card)).not.toMatch(/хамтрагч|харилцааны давуу|анхаар/i)
    expect(card.cta).toBe('Чиний хайрын хэв маяг юу вэ?')
  })
})

describe('inviteText', () => {
  it('invites the other person to take it separately, never to see answers', () => {
    expect(inviteText('partner', null)).toContain('тус тусдаа')
  })

  it('mentions the love style when inviting a friend', () => {
    expect(inviteText('friend', LOVE_STYLES.anchor)).toContain('Тайван бэхлэгч')
  })
})

describe('messengerTarget', () => {
  const link = 'https://lemony.mn/?utm_source=share'

  it('opens the Messenger app on phones, never the Facebook feed', () => {
    expect(messengerTarget('android', link, undefined, 'https://lemony.mn').url).toMatch(/^intent:\/\/share\/\?link=.*package=com\.facebook\.orca;end$/)
    expect(messengerTarget('ios', link, undefined, 'https://lemony.mn').url).toBe(`fb-messenger://share/?link=${encodeURIComponent(link)}`)
  })

  it('uses Messenger’s send dialog on computers when an App ID is set', () => {
    const t = messengerTarget('other', link, '123', 'https://lemony.mn')
    expect(t.kind).toBe('dialog')
    expect(t.url).toContain('facebook.com/dialog/send?app_id=123')
    expect(t.url).not.toContain('sharer')
  })

  it('falls back to messenger.com on computers without an App ID', () => {
    expect(messengerTarget('other', link, undefined, 'https://lemony.mn')).toEqual({ kind: 'web', url: 'https://www.messenger.com/' })
  })
})

describe('siteHost', () => {
  it('prints the brand domain instead of localhost', () => {
    expect(siteHost()).toBe('lemony.mn')
  })
})

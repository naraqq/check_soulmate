import { describe, expect, it } from 'vitest'
import { detectSource } from './analytics'

const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36'
const FB_APP = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]'
const site = (query = '') => new URL(`https://lemony.mn/${query}`)

describe('detectSource', () => {
  it('prefers UTM tags', () => {
    expect(detectSource(site('?utm_source=instagram&utm_medium=story&utm_campaign=oct'), 'https://l.facebook.com/', CHROME)).toEqual({
      source: 'instagram',
      medium: 'story',
      campaign: 'oct',
      referrer: 'l.facebook.com',
    })
  })

  it('recognises Google and Facebook click ids', () => {
    expect(detectSource(site('?gclid=abc'), '', CHROME)).toMatchObject({ source: 'google', medium: 'cpc' })
    expect(detectSource(site('?fbclid=abc'), '', CHROME)).toMatchObject({ source: 'facebook', medium: 'social' })
  })

  it('names well-known referrers and keeps others as referrals', () => {
    expect(detectSource(site(), 'https://www.google.com/search?q=x', CHROME)).toEqual({ source: 'google', medium: 'organic', referrer: 'google.com' })
    expect(detectSource(site(), 'https://news.mn/article', CHROME)).toEqual({ source: 'news.mn', medium: 'referral', referrer: 'news.mn' })
  })

  it('ignores our own pages as referrer', () => {
    expect(detectSource(site(), 'https://lemony.mn/privacy', CHROME)).toBeNull()
  })

  it('credits the Facebook app when it sends no referrer', () => {
    expect(detectSource(site(), '', FB_APP)).toEqual({ source: 'facebook', medium: 'social' })
  })

  it('treats everything else as direct', () => {
    expect(detectSource(site(), '', CHROME)).toBeNull()
  })
})

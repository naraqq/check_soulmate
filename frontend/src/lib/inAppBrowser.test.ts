import { describe, expect, it } from 'vitest'
import { detectInAppBrowser, externalBrowserUrl } from './inAppBrowser'

const UA = {
  messengerIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/458.0.0.44.108;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5]',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.35.105;FBBV/615467013;FBDV/iPhone15,2]',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.3.24.110 (iPhone15,2; iOS 17_5; en_US)',
  messengerAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/455.0.0.36.109;]',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeDesktop:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
}

describe('detectInAppBrowser', () => {
  it('recognises Messenger on iPhone (the reported case)', () => {
    expect(detectInAppBrowser(UA.messengerIos)).toEqual({ app: 'Messenger', platform: 'ios' })
  })

  it('recognises Facebook, Instagram and Messenger on Android', () => {
    expect(detectInAppBrowser(UA.facebookIos).app).toBe('Facebook')
    expect(detectInAppBrowser(UA.instagramIos).app).toBe('Instagram')
    expect(detectInAppBrowser(UA.messengerAndroid)).toEqual({ app: 'Messenger', platform: 'android' })
  })

  it('treats Safari and desktop browsers as normal', () => {
    expect(detectInAppBrowser(UA.safariIos)).toEqual({ app: null, platform: 'ios' })
    expect(detectInAppBrowser(UA.chromeDesktop)).toEqual({ app: null, platform: 'other' })
  })
})

describe('externalBrowserUrl', () => {
  const url = 'https://lemony.mn/payment/abc123?x=1'

  it('builds an x-safari link on iOS', () => {
    expect(externalBrowserUrl(url, 'ios')).toBe('x-safari-https://lemony.mn/payment/abc123?x=1')
  })

  it('builds a Chrome intent on Android', () => {
    expect(externalBrowserUrl(url, 'android')).toBe(
      'intent://lemony.mn/payment/abc123?x=1#Intent;scheme=https;action=android.intent.action.VIEW;end',
    )
  })

  it('has nothing to offer elsewhere', () => {
    expect(externalBrowserUrl(url, 'other')).toBeNull()
  })
})

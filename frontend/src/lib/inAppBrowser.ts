/**
 * In-app browsers (Messenger, Facebook, Instagram…) block links that open
 * other apps — on iOS the QPay bank deep links (khanbank://…) simply do
 * nothing there. We detect them so the payment page can offer a way out.
 */

export type Platform = 'ios' | 'android' | 'other'

export interface InAppBrowser {
  /** e.g. "Messenger"; null when this is a normal browser. */
  app: string | null
  platform: Platform
}

const APPS: [RegExp, string][] = [
  [/MessengerForiOS|MessengerLiteForiOS|Orca-Android/i, 'Messenger'],
  [/Instagram/i, 'Instagram'],
  [/FBAN|FBAV|FB_IAB|FBIOS|FB4A/i, 'Facebook'],
  [/musical_ly|BytedanceWebview|TikTok/i, 'TikTok'],
  [/\bLine\//i, 'LINE'],
]

export function detectInAppBrowser(userAgent: string): InAppBrowser {
  const platform: Platform = /iPhone|iPad|iPod/i.test(userAgent) ? 'ios' : /Android/i.test(userAgent) ? 'android' : 'other'
  const match = APPS.find(([pattern]) => pattern.test(userAgent))
  return { app: match ? match[1] : null, platform }
}

/**
 * A link that asks the OS to open `url` in the system browser.
 * iOS (17+): the x-safari-https scheme hands the page to Safari.
 * Android: an intent URL hands it to Chrome (or the default browser).
 */
export function externalBrowserUrl(url: string, platform: Platform): string | null {
  const parsed = new URL(url)
  const rest = `${parsed.host}${parsed.pathname}${parsed.search}`
  if (platform === 'ios') return `x-safari-${parsed.protocol === 'http:' ? 'http' : 'https'}://${rest}`
  if (platform === 'android') {
    return `intent://${rest}#Intent;scheme=${parsed.protocol.replace(':', '')};action=android.intent.action.VIEW;end`
  }
  return null
}

/** Clipboard copy that also works in in-app browsers without the async Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch {
    return false
  }
}

import type { Track } from '../data/types'
import type { CardContent } from './shareCard'

/** Where the share button was pressed. */
export type SharePlacement = 'teaser' | 'report'

/** How it was shared — becomes utm_medium, so the dashboard shows which method brings visitors. */
export type ShareMethod = 'native_image' | 'native_link' | 'messenger' | 'instagram_story' | 'download' | 'copy_link'

const PUBLIC_HOST = 'lemony.mn'

/** The host printed on cards: the real one in production, the brand domain when testing locally. */
export function siteHost(): string {
  const host = window.location.host
  return /^(localhost|127\.|\[::1\])/.test(host) ? PUBLIC_HOST : host.replace(/^www\./, '')
}

/** Landing page link tagged so the visit is credited to sharing. */
export function shareUrl(method: ShareMethod, placement: SharePlacement): string {
  const url = new URL('/', window.location.origin)
  url.searchParams.set('utm_source', 'share')
  url.searchParams.set('utm_medium', method)
  url.searchParams.set('utm_campaign', placement)
  return url.toString()
}

export function shareText(track: Track): string {
  return track === 'early'
    ? 'Танилцаж байгаа хүнтэйгээ ирээдүйтэй юу гэдгээ Lemony-гоор шалгалаа 🍋 Чи ч гэсэн шалгаад үз:'
    : 'Би Lemony-гоор харилцаагаа шалгалаа 🍋 Чи ч гэсэн шалгаад үз:'
}

/**
 * Where the Messenger button goes — always Messenger itself, never the Facebook feed:
 * - Android: an intent aimed at the Messenger app package (opens the app's share screen).
 * - iOS: Messenger's share URL scheme.
 * - Computer: Messenger's send dialog when a Facebook App ID is configured (it requires one);
 *   otherwise messenger.com, with the link already copied for pasting.
 */
export function messengerTarget(platform: 'ios' | 'android' | 'other', link: string, appId: string | undefined, origin: string) {
  const encoded = encodeURIComponent(link)
  if (platform === 'android') return { kind: 'app' as const, url: `intent://share/?link=${encoded}#Intent;scheme=fb-messenger;package=com.facebook.orca;end` }
  if (platform === 'ios') return { kind: 'app' as const, url: `fb-messenger://share/?link=${encoded}` }
  if (appId) {
    return {
      kind: 'dialog' as const,
      url: `https://www.facebook.com/dialog/send?app_id=${encodeURIComponent(appId)}&link=${encoded}&redirect_uri=${encodeURIComponent(origin)}`,
    }
  }
  return { kind: 'web' as const, url: 'https://www.messenger.com/' }
}

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** Whether the system share sheet can take an image (Instagram Story, Messenger… appear there). */
export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

/**
 * The card someone shares: only their strengths — never concerns, answers or anything
 * about the other person, so it's safe to post where that person might see it.
 */
export function strengthsCard(track: Track, strengths: string[]): Omit<CardContent, 'theme'> {
  const items = strengths
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
  const footnote = `${siteHost()} · 7 минутын шалгалт`
  if (track === 'early') {
    return {
      eyebrow: 'Танилцаж буй харилцааны маань сайн эхлэл',
      title: items.length ? 'Бидний хооронд юу сайн байна вэ' : 'Би харилцаагаа гаднаас нь харлаа',
      items,
      cta: 'Энэ харилцаа ирээдүйтэй юу? Шалгаад үз',
      footnote,
    }
  }
  return {
    eyebrow: 'Миний харилцааны давуу талууд',
    title: items.length ? 'Бидний харилцааны хамгийн хүчтэй талууд' : 'Би харилцаагаа гаднаас нь харлаа',
    items,
    cta: 'Та хоёрын давуу тал юу вэ?',
    footnote,
  }
}

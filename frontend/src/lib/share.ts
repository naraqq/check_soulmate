import type { LoveStyle } from '../data/loveStyles'
import type { Track } from '../data/types'
import type { CardContent } from './shareCard'

/** Where the share button was pressed. */
export type SharePlacement = 'teaser' | 'report'

/** How it was shared — becomes utm_medium, so the dashboard shows which method brings visitors. */
export type ShareMethod =
  | 'native_image'
  | 'native_link'
  | 'messenger'
  | 'instagram_story'
  | 'download'
  | 'copy_link'
  | 'invite_friend'
  | 'invite_partner'
  // The guessing game ("Миний хайрын хэв маягийг тааж чадах уу?")
  | 'guess_native'
  | 'guess_story'
  | 'guess_messenger'
  | 'guess_copy'

const PUBLIC_HOST = 'lemony.mn'

/** The host printed on cards: the real one in production, the brand domain when testing locally. */
export function siteHost(): string {
  const host = window.location.host
  return /^(localhost|127\.|\[::1\])/.test(host) ? PUBLIC_HOST : host.replace(/^www\./, '')
}

/**
 * Landing page link tagged so the visit is credited to sharing. With an audience the friend
 * lands on the matching page (a "ирээдүйтэй юу?" card opens the early-stage version).
 */
export function shareUrl(method: ShareMethod, placement: SharePlacement, audience?: Track): string {
  const url = new URL('/', window.location.origin)
  if (audience) url.searchParams.set('for', audience)
  url.searchParams.set('utm_source', 'share')
  url.searchParams.set('utm_medium', method)
  url.searchParams.set('utm_campaign', placement)
  return url.toString()
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

/** The story card: the person's love style — about them, always flattering, nothing about the relationship. */
export function loveStyleCard(style: LoveStyle): CardContent {
  return {
    eyebrow: 'Миний хайрын хэв маяг',
    title: style.name,
    body: style.description,
    items: [...style.traits],
    cta: 'Чиний хайрын хэв маяг юу вэ?',
    footnote: `${siteHost()} · 7 минутын шалгалт`,
    theme: style.theme,
  }
}

/** Private invites — sent to one person, which suits this topic better than a public post. */
export type InviteKind = 'friend' | 'partner'

export function inviteText(kind: InviteKind, style: LoveStyle | null): string {
  if (kind === 'partner') {
    return 'Хоёулаа энэ шалгалтыг тус тусдаа хийгээд, юу гарсныг хамтдаа ярилцах уу? 🍋 7 минут л болно:'
  }
  return style
    ? `Миний хайрын хэв маяг “${style.name}” гарлаа 🍋 Чинийх юу болохыг хараач:`
    : 'Энэ харилцааны шалгалтыг хийгээд үзээч, надад их таалагдсан 🍋'
}

/** Link to the guessing game for this code, tagged so the dashboard credits the game. */
export function guessUrl(code: string, method: ShareMethod): string {
  const url = new URL(`/guess/${code}`, window.location.origin)
  url.searchParams.set('utm_source', 'share')
  url.searchParams.set('utm_medium', method)
  url.searchParams.set('utm_campaign', 'guess')
  return url.toString()
}

/** Story card for the game: three names to guess from, never the answer itself. */
export function guessCard(hints: LoveStyle[]): CardContent {
  return {
    eyebrow: 'Хайрын хэв маяг',
    title: 'Миний хайрын хэв маягийг тааж чадах уу?',
    body: hints.map((h) => `${h.name}?`).join(' '),
    cta: 'Таагаад үз →',
    footnote: siteHost(),
    theme: 'rose',
  }
}

export function guessText(hints: LoveStyle[]): string {
  return `Миний хайрын хэв маягийг тааж чадах уу? 💗 ${hints.map((h) => `${h.name}?`).join(' ')} Таагаад үз →`
}

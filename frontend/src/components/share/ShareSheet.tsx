import { Camera, Check, Download, Heart, Link2, Loader2, MessageCircle, Share2, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { LoveStyle } from '../../data/loveStyles'
import type { Track } from '../../data/types'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/format'
import { detectInAppBrowser } from '../../lib/inAppBrowser'
import {
  canShareFile,
  inviteText,
  isMobile,
  loveStyleCard,
  messengerTarget,
  shareUrl,
  type InviteKind,
  type ShareMethod,
  type SharePlacement,
} from '../../lib/share'
import { canvasToBlob, downloadBlob, renderCard, type CardFormat } from '../../lib/shareCard'

interface Props {
  open: boolean
  onClose: () => void
  placement: SharePlacement
  flow: Track
  /** Null when unknown on this device — then only the private invites are offered. */
  loveStyle: LoveStyle | null
}

type Rendered = Record<'story' | 'square', { file: File; url: string }>

const FORMATS: { id: 'story' | 'square'; label: string }[] = [
  { id: 'story', label: 'Story' },
  { id: 'square', label: 'Пост' },
]

/**
 * Two ways to share, matched to how people actually behave:
 * - publicly: a love-style card about *themselves* (never about the relationship);
 * - privately: an invite to one friend, or to the other person to take it too.
 * Every link is UTM-tagged with the method, so the dashboard shows what brings people.
 */
export function ShareSheet({ open, onClose, placement, flow, loveStyle }: Props) {
  const [format, setFormat] = useState<'story' | 'square'>('story')
  const [images, setImages] = useState<Rendered | null>(null)
  const [done, setDone] = useState<ShareMethod | null>(null)
  const [tip, setTip] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const inApp = detectInAppBrowser(navigator.userAgent).app

  // Render the love-style card in both formats when opened; free the memory when closed.
  useEffect(() => {
    if (!open) return
    let active = true
    const urls: string[] = []
    track({ name: 'share_opened', props: { detail: placement } })
    if (loveStyle) {
      const content = loveStyleCard(loveStyle)
      const render = async (f: CardFormat) => {
        const blob = await canvasToBlob(await renderCard(f, content))
        const url = URL.createObjectURL(blob)
        urls.push(url)
        return { file: new File([blob], `lemony-${loveStyle.id}-${f}.png`, { type: 'image/png' }), url }
      }
      void (async () => {
        const story = await render('story')
        const square = await render('square')
        if (active) setImages({ story, square })
      })()
    }
    return () => {
      active = false
      urls.forEach((u) => URL.revokeObjectURL(u))
      setImages(null)
      setDone(null)
      setTip(null)
    }
  }, [open, placement, loveStyle])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null

  const current = images?.[format]

  function completed(method: ShareMethod, message?: string) {
    track({ name: 'share_completed', props: { detail: method } })
    setDone(method)
    setTip(message ?? null)
  }

  /** Download, or — where downloads are blocked (in-app browsers) — ask for a long-press save. */
  function saveImage(file: File, method: ShareMethod, message: string) {
    if (inApp) {
      setTip('Энэ апп дотор татах боломжгүй байж магадгүй. Дээрх зураг дээр удаан дараад “Save image / Хадгалах” гэж сонгоорой.')
      track({ name: 'share_completed', props: { detail: method } })
      return
    }
    downloadBlob(file, file.name)
    completed(method, message)
  }

  /** The phone's share menu (Messenger, Instagram, Telegram… all appear there). */
  async function nativeShare(method: ShareMethod, text: string, url: string, file?: File): Promise<boolean> {
    if (!('share' in navigator)) return false
    try {
      if (file && canShareFile(file)) await navigator.share({ files: [file], text: `${text} ${url}` })
      else await navigator.share({ text, url })
      completed(method)
      return true
    } catch (e) {
      // Cancelled by the user — not an error, nothing more to do.
      return e instanceof DOMException && e.name === 'AbortError'
    }
  }

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  // --- Public: the love-style card -------------------------------------------------

  async function shareCard() {
    if (!current || !loveStyle) return
    const method = canShareFile(current.file) ? 'native_image' : 'native_link'
    if (await nativeShare(method, inviteText('friend', loveStyle), shareUrl(method, placement), current.file)) return
    saveImage(current.file, 'download', 'Зураг татагдлаа. Story эсвэл пост болгон нэмээрэй.')
  }

  async function shareStory() {
    if (!images || !loveStyle) return
    setFormat('story')
    const file = images.story.file
    const how = 'Instagram эсвэл Facebook-ээ нээгээд Story → зургаа сонгоорой. “Link” стикерээр холбоосоо нэмбэл найзууд тань шууд орж ирнэ.'
    if (isMobile() && canShareFile(file)) {
      if (await nativeShare('instagram_story', inviteText('friend', loveStyle), shareUrl('instagram_story', placement), file)) {
        setTip(how)
        return
      }
    }
    saveImage(file, 'instagram_story', `Зураг татагдлаа. ${how}`)
  }

  // --- Private: invites ------------------------------------------------------------

  async function invite(kind: InviteKind) {
    const method: ShareMethod = kind === 'partner' ? 'invite_partner' : 'invite_friend'
    // The other person gets the page for their own stage; a friend gets the general page.
    const url = shareUrl(method, placement, kind === 'partner' ? flow : undefined)
    const text = inviteText(kind, loveStyle)
    if (isMobile() && (await nativeShare(method, text, url))) return
    // Computer (or no share menu): copy the message, then open Messenger to paste it.
    const copied = await copy(`${text} ${url}`)
    const target = messengerTarget('other', url, import.meta.env.VITE_FACEBOOK_APP_ID, window.location.origin)
    window.open(target.url, '_blank', 'noopener,width=640,height=640')
    completed(method, copied ? 'Мессеж хуулагдлаа. Messenger-т хүнээ сонгоод Ctrl+V дарж буулгаарай.' : `${text} ${url}`)
  }

  function shareMessenger() {
    const link = shareUrl('messenger', placement)
    const text = inviteText('friend', loveStyle)
    // Copy first (still inside the tap), so pasting works even if Messenger doesn't take the link.
    void copy(`${text} ${link}`)
    const { platform } = detectInAppBrowser(navigator.userAgent)
    const target = messengerTarget(platform, link, import.meta.env.VITE_FACEBOOK_APP_ID, window.location.origin)
    if (target.kind === 'app') {
      window.location.href = target.url
      completed('messenger', 'Messenger нээгдээгүй бол мессеж аль хэдийн хуулагдсан байгаа. Messenger-ээ нээгээд чатандаа буулгаарай.')
    } else {
      window.open(target.url, '_blank', 'noopener,width=640,height=640')
      completed(
        'messenger',
        target.kind === 'dialog' ? 'Messenger-ийн цонхноос хүнээ сонгоод илгээгээрэй.' : 'Мессеж хуулагдлаа. Нээгдсэн Messenger-т хүнээ сонгоод Ctrl+V дарж буулгаарай.',
      )
    }
  }

  async function copyLink() {
    const url = shareUrl('copy_link', placement)
    if (await copy(`${inviteText('friend', loveStyle)} ${url}`)) completed('copy_link', 'Холбоос хуулагдлаа. Хаана ч хамаагүй буулгаарай.')
    else setTip(url)
  }

  const small = 'flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white/[0.04] px-2 py-3 text-xs font-medium hover:bg-white/10 disabled:opacity-40'
  const inviteBtn = 'flex w-full items-center gap-3 rounded-2xl border border-line bg-white/[0.04] px-4 py-3.5 text-left hover:bg-white/10'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-4xl border border-line bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift sm:rounded-4xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="share-title" className="font-display text-xl font-semibold">
            {loveStyle ? 'Хайрын хэв маягаа хуваалцах' : 'Найзаа урих'}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Хаах" className="grid size-9 shrink-0 place-items-center rounded-xl hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        {loveStyle && (
          <>
            <div role="tablist" aria-label="Зургийн хэлбэр" className="mt-4 flex rounded-xl border border-line p-0.5">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  type="button"
                  aria-selected={format === f.id}
                  onClick={() => setFormat(f.id)}
                  className={cn('flex-1 rounded-lg py-1.5 text-sm', format === f.id ? 'bg-clay-soft font-semibold text-clay-dark' : 'text-ink-soft')}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className={cn('mx-auto mt-4 overflow-hidden rounded-2xl border border-line bg-black/30', format === 'story' ? 'aspect-[9/16] w-48' : 'aspect-square w-60')}>
              {current ? (
                <img src={current.url} alt={`Хуваалцах зураг: миний хайрын хэв маяг — ${loveStyle.name}`} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-ink-muted">
                  <Loader2 className="size-6 animate-spin" aria-label="Зураг бэлдэж байна" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => void shareCard()}
              disabled={!current}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-white shadow-glow disabled:opacity-50"
            >
              <Share2 className="size-5" /> Хуваалцах
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void shareStory()} disabled={!images} className={small}>
                <Camera className="size-5 text-dusk" /> Story-д нэмэх
              </button>
              <button
                type="button"
                onClick={() => current && saveImage(current.file, 'download', 'Зураг татагдлаа.')}
                disabled={!current}
                className={small}
              >
                <Download className="size-5 text-sage" /> Зураг татах
              </button>
            </div>
          </>
        )}

        <div className={cn(loveStyle ? 'mt-6 border-t border-line pt-5' : 'mt-4')}>
          {loveStyle && <p className="mb-3 text-sm font-semibold">Эсвэл хувиараа урих</p>}
          <div className="space-y-2">
            <button type="button" onClick={() => void invite('friend')} className={inviteBtn}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-clay-soft">
                <Users className="size-5 text-clay" />
              </span>
              <span>
                <span className="block font-semibold">Найзаа урих</span>
                <span className="block text-xs text-ink-muted">Messenger, Telegram эсвэл хаана ч</span>
              </span>
            </button>
            <button type="button" onClick={() => void invite('partner')} className={inviteBtn}>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-dusk-soft">
                <Heart className="size-5 text-dusk" />
              </span>
              <span>
                <span className="block font-semibold">Нөгөө хүнээ урих</span>
                <span className="block text-xs text-ink-muted">Хоёулаа тус тусдаа хийгээд, хамтдаа ярилцаарай</span>
              </span>
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={shareMessenger} className={small}>
              <MessageCircle className="size-5 text-clay" /> Messenger
            </button>
            <button type="button" onClick={() => void copyLink()} className={small}>
              {done === 'copy_link' ? <Check className="size-5 text-sage" /> : <Link2 className="size-5 text-lemon" />} Холбоос хуулах
            </button>
          </div>
        </div>

        {tip && (
          <p role="status" className="mt-4 rounded-2xl bg-clay-soft px-4 py-3 text-sm leading-relaxed break-words">
            {tip}
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
          Таны хариулт, харилцааны тань тухай юу ч хуваалцагдахгүй. Урьсан хүн өөрийн шалгалтыг тусад нь хийнэ — та хоёр бие биеийнхээ
          хариултыг харахгүй.
        </p>
      </div>
    </div>
  )
}

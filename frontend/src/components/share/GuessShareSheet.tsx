import { Camera, Check, Link2, Loader2, MessageCircle, Share2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { guessCode, guessHints } from '../../data/guessGame'
import type { LoveStyle } from '../../data/loveStyles'
import { track } from '../../lib/analytics'
import { detectInAppBrowser } from '../../lib/inAppBrowser'
import { canShareFile, guessCard, guessText, guessUrl, isMobile, messengerTarget, type ShareMethod } from '../../lib/share'
import { canvasToBlob, downloadBlob, renderCard } from '../../lib/shareCard'

/**
 * "Найзуудаасаа асуух": a Story card and a link where friends guess the person's love style
 * before seeing it. One code per opening, so each share is its own little game.
 */
export function GuessShareSheet({ open, onClose, loveStyle }: { open: boolean; onClose: () => void; loveStyle: LoveStyle }) {
  const code = useMemo(() => guessCode(loveStyle.id), [loveStyle.id])
  const hints = useMemo(() => guessHints(code), [code])
  const [image, setImage] = useState<{ file: File; url: string } | null>(null)
  const [done, setDone] = useState<ShareMethod | null>(null)
  const [tip, setTip] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const inApp = detectInAppBrowser(navigator.userAgent).app

  useEffect(() => {
    if (!open) return
    let active = true
    let url: string | null = null
    track({ name: 'share_opened', props: { detail: 'guess' } })
    void (async () => {
      const blob = await canvasToBlob(await renderCard('story', guessCard(hints)))
      if (!active) return
      url = URL.createObjectURL(blob)
      setImage({ file: new File([blob], 'lemony-guess.png', { type: 'image/png' }), url })
    })()
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
      setImage(null)
      setDone(null)
      setTip(null)
    }
  }, [open, hints])

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

  function completed(method: ShareMethod, message?: string) {
    track({ name: 'share_completed', props: { detail: method } })
    setDone(method)
    setTip(message ?? null)
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  async function nativeShare(method: ShareMethod, file?: File): Promise<boolean> {
    if (!('share' in navigator)) return false
    const url = guessUrl(code, method)
    try {
      if (file && canShareFile(file)) await navigator.share({ files: [file], text: `${guessText(hints)} ${url}` })
      else await navigator.share({ text: guessText(hints), url })
      completed(method)
      return true
    } catch (e) {
      return e instanceof DOMException && e.name === 'AbortError'
    }
  }

  async function shareMain() {
    if (await nativeShare('guess_native', image?.file)) return
    await copyLink()
  }

  /** Story: the image, plus the link already copied for Instagram's "Link" sticker. */
  async function shareStory() {
    if (!image) return
    const link = guessUrl(code, 'guess_story')
    const copied = await copy(link)
    const how = `${copied ? 'Холбоос хуулагдсан. ' : ''}Story-доо зургаа нэмээд, “Link” стикер дээр дарж холбоосоо буулгаарай — найзууд чинь шууд таах болно.`
    if (isMobile() && canShareFile(image.file)) {
      try {
        await navigator.share({ files: [image.file] })
        completed('guess_story', how)
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    if (inApp) {
      completed('guess_story', `Дээрх зураг дээр удаан дараад хадгална уу. ${how}`)
      return
    }
    downloadBlob(image.file, image.file.name)
    completed('guess_story', `Зураг татагдлаа. ${how}`)
  }

  function shareMessenger() {
    const link = guessUrl(code, 'guess_messenger')
    void copy(`${guessText(hints)} ${link}`)
    const { platform } = detectInAppBrowser(navigator.userAgent)
    const target = messengerTarget(platform, link, import.meta.env.VITE_FACEBOOK_APP_ID, window.location.origin)
    if (target.kind === 'app') window.location.href = target.url
    else window.open(target.url, '_blank', 'noopener,width=640,height=640')
    completed('guess_messenger', 'Messenger нээгдээгүй бол мессеж хуулагдсан байгаа — чатандаа буулгаарай.')
  }

  async function copyLink() {
    const link = guessUrl(code, 'guess_copy')
    if (await copy(`${guessText(hints)} ${link}`)) completed('guess_copy', 'Хуулагдлаа. Хаана ч хамаагүй буулгаарай.')
    else setTip(link)
  }

  const small = 'flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white/[0.04] px-2 py-3 text-xs font-medium hover:bg-white/10 disabled:opacity-40'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guess-share-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-4xl border border-line bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lift sm:rounded-4xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="guess-share-title" className="font-display text-xl font-semibold">
              Найзуудаасаа асуух
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Тэд эхлээд таана, дараа нь үнэн хариуг харна.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Хаах" className="grid size-9 shrink-0 place-items-center rounded-xl hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

        <div className="mx-auto mt-4 aspect-[9/16] w-48 overflow-hidden rounded-2xl border border-line bg-black/30">
          {image ? (
            <img src={image.url} alt="Story зураг: Миний хайрын хэв маягийг тааж чадах уу?" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-ink-muted">
              <Loader2 className="size-6 animate-spin" aria-label="Зураг бэлдэж байна" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void shareMain()}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-white shadow-glow"
        >
          <Share2 className="size-5" /> Найзуудаасаа асуух
        </button>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => void shareStory()} disabled={!image} className={small}>
            <Camera className="size-5 text-dusk" /> Story
          </button>
          <button type="button" onClick={shareMessenger} className={small}>
            <MessageCircle className="size-5 text-clay" /> Messenger
          </button>
          <button type="button" onClick={() => void copyLink()} className={small}>
            {done === 'guess_copy' ? <Check className="size-5 text-sage" /> : <Link2 className="size-5 text-lemon" />} Холбоос
          </button>
        </div>

        {tip && (
          <p role="status" className="mt-4 rounded-2xl bg-clay-soft px-4 py-3 text-sm leading-relaxed break-words">
            {tip}
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          Холбоосоор зөвхөн таны хайрын хэв маягийн нэр харагдана. Таны хариулт, тайлан хуваалцагдахгүй.
        </p>
      </div>
    </div>
  )
}

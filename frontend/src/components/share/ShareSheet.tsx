import { Camera, Check, Download, Link2, Loader2, MessageCircle, Share2, ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Track } from '../../data/types'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/format'
import { detectInAppBrowser } from '../../lib/inAppBrowser'
import { canShareFile, isMobile, shareText, shareUrl, strengthsCard, type ShareMethod, type SharePlacement } from '../../lib/share'
import { canvasToBlob, downloadBlob, renderCard, type CardFormat } from '../../lib/shareCard'

interface Props {
  open: boolean
  onClose: () => void
  placement: SharePlacement
  flow: Track
  strengths: string[]
}

type Rendered = Record<'story' | 'square', { file: File; url: string }>

const FORMATS: { id: 'story' | 'square'; label: string }[] = [
  { id: 'story', label: 'Story' },
  { id: 'square', label: 'Пост' },
]

/**
 * Share your strengths as an image (Instagram / Facebook Story, Messenger, feed) or as a link.
 * Every link is UTM-tagged with the method, so the dashboard shows what actually brings people.
 */
export function ShareSheet({ open, onClose, placement, flow, strengths }: Props) {
  const [format, setFormat] = useState<'story' | 'square'>('story')
  const [images, setImages] = useState<Rendered | null>(null)
  const [done, setDone] = useState<ShareMethod | null>(null)
  const [tip, setTip] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const inApp = detectInAppBrowser(navigator.userAgent).app

  // Render both formats when opened; free the image memory when closed.
  const strengthsKey = strengths.join('|')
  useEffect(() => {
    if (!open) return
    let active = true
    const urls: string[] = []
    track({ name: 'share_opened', props: { detail: placement } })
    const content = strengthsCard(flow, strengthsKey ? strengthsKey.split('|') : [])
    const render = async (f: CardFormat, theme: 'violet' | 'rose') => {
      const blob = await canvasToBlob(await renderCard(f, { ...content, theme }))
      const url = URL.createObjectURL(blob)
      urls.push(url)
      return { file: new File([blob], `lemony-${f}.png`, { type: 'image/png' }), url }
    }
    void (async () => {
      const story = await render('story', 'violet')
      const square = await render('square', 'rose')
      if (active) setImages({ story, square })
    })()
    return () => {
      active = false
      urls.forEach((u) => URL.revokeObjectURL(u))
      setImages(null)
      setDone(null)
      setTip(null)
    }
  }, [open, placement, flow, strengthsKey])

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

  async function nativeShare(method: ShareMethod, file?: File) {
    const url = shareUrl(method, placement)
    const text = `${shareText(flow)} ${url}`
    try {
      if (file && canShareFile(file)) await navigator.share({ files: [file], text })
      else await navigator.share({ text, url })
      completed(method)
      return true
    } catch (e) {
      // Cancelled by the user — not an error, nothing to do.
      if (e instanceof DOMException && e.name === 'AbortError') return true
      return false
    }
  }

  async function shareMain() {
    if (!current) return
    if ('share' in navigator && (await nativeShare(canShareFile(current.file) ? 'native_image' : 'native_link', current.file))) return
    await copyLink()
  }

  async function shareStory() {
    if (!images) return
    setFormat('story')
    const file = images.story.file
    const how = 'Instagram эсвэл Facebook-ээ нээгээд Story → зургаа сонгоорой. “Link” стикерээр холбоосоо нэмбэл найзууд тань шууд орж ирнэ.'
    if (isMobile() && canShareFile(file)) {
      if (await nativeShare('instagram_story', file)) {
        setTip(how)
        return
      }
    }
    saveImage(file, 'instagram_story', `Зураг татагдлаа. ${how}`)
  }

  function shareMessenger() {
    const url = shareUrl('messenger', placement)
    if (isMobile()) {
      window.location.href = `fb-messenger://share/?link=${encodeURIComponent(url)}`
    } else {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,width=640,height=560')
    }
    completed('messenger', 'Messenger нээгдээгүй бол “Холбоос хуулах” дараад чатандаа буулгаарай.')
  }

  async function copyLink() {
    const url = shareUrl('copy_link', placement)
    try {
      await navigator.clipboard.writeText(`${shareText(flow)} ${url}`)
      completed('copy_link', 'Холбоос хуулагдлаа. Messenger, Instagram эсвэл хаана ч хамаагүй буулгаарай.')
    } catch {
      setTip(url)
    }
  }

  const secondary = 'flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white/[0.04] px-2 py-3 text-xs font-medium hover:bg-white/10 disabled:opacity-40'

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
          <div>
            <h2 id="share-title" className="font-display text-xl font-semibold">
              Найзуудтайгаа хуваалцах
            </h2>
            <p className="mt-1 text-sm text-ink-muted">Story, Messenger эсвэл пост болгон.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Хаах" className="grid size-9 shrink-0 place-items-center rounded-xl hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>

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

        <div className={cn('mx-auto mt-4 overflow-hidden rounded-2xl border border-line bg-black/30', format === 'story' ? 'aspect-[9/16] w-52' : 'aspect-square w-64')}>
          {current ? (
            <img src={current.url} alt="Хуваалцах зураг: таны харилцааны давуу талууд" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-ink-muted">
              <Loader2 className="size-6 animate-spin" aria-label="Зураг бэлдэж байна" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void shareMain()}
          disabled={!current}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent font-semibold text-white shadow-glow disabled:opacity-50"
        >
          <Share2 className="size-5" /> Хуваалцах
        </button>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button type="button" onClick={() => void shareStory()} disabled={!images} className={secondary}>
            <Camera className="size-5 text-dusk" /> Story
          </button>
          <button type="button" onClick={shareMessenger} className={secondary}>
            <MessageCircle className="size-5 text-clay" /> Messenger
          </button>
          <button
            type="button"
            onClick={() => current && saveImage(current.file, 'download', 'Зураг татагдлаа.')}
            disabled={!current}
            className={secondary}
          >
            <Download className="size-5 text-sage" /> Татах
          </button>
          <button type="button" onClick={() => void copyLink()} className={secondary}>
            {done === 'copy_link' ? <Check className="size-5 text-sage" /> : <Link2 className="size-5 text-lemon" />} Холбоос
          </button>
        </div>

        {tip && (
          <p role="status" className="mt-4 rounded-2xl bg-clay-soft px-4 py-3 text-sm leading-relaxed break-words">
            {tip}
          </p>
        )}

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
          Зураг дээр зөвхөн давуу талууд харагдана. Таны хариулт, санаа зовоосон зүйлс, нөгөө хүний тухай мэдээлэл орохгүй.
        </p>
      </div>
    </div>
  )
}

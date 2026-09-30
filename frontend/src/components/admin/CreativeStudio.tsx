import { Check, Copy, Download, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAppConfig } from '../../hooks/useAppConfig'
import { cn, formatPrice } from '../../lib/format'
import { siteHost } from '../../lib/share'
import { CARD_SIZES, canvasToBlob, downloadBlob, renderCard, type CardContent, type CardFormat, type CardTheme } from '../../lib/shareCard'

interface Template {
  id: string
  name: string
  content: (price: string) => Omit<CardContent, 'footnote'>
}

/**
 * Starting points for ads and posts. Hooks use thoughts people actually have (as on the
 * landing page) — people stop scrolling when they recognise themselves.
 */
const TEMPLATES: Template[] = [
  {
    id: 'hook-initiates',
    name: 'Бодол: “Би л түрүүлж бичдэг”',
    content: () => ({ eyebrow: 'Танд ч ийм санагддаг уу?', title: '“Би л үргэлж түрүүлж бичдэг юм шиг.”', cta: '7 минутад харилцаагаа ойлгоорой', theme: 'rose' }),
  },
  {
    id: 'hook-distant',
    name: 'Бодол: “Хол болчихсон юм шиг”',
    content: () => ({ eyebrow: 'Танд ч ийм санагддаг уу?', title: '“Маргалддаггүй ч, хол болчихсон юм шиг санагддаг.”', cta: '7 минутад харилцаагаа ойлгоорой', theme: 'violet' }),
  },
  {
    id: 'hook-future',
    name: 'Бодол: “Ирээдүйдээ хардаг болов уу?”',
    content: () => ({ eyebrow: 'Танд ч ийм санагддаг уу?', title: '“Тэр намайг ирээдүйдээ хардаг болов уу?”', cta: 'Шалгаад үзээрэй', theme: 'lemon' }),
  },
  {
    id: 'early',
    name: 'Танилцаж буй хүмүүст',
    content: () => ({
      eyebrow: 'Чатлаж, танилцаж байгаа юу?',
      title: 'Энэ харилцаа ирээдүйтэй юу?',
      items: ['Тэр чамайг хэр сонирхож байна', 'Та хоёр ижил зүйл хайж байна уу', 'Анхаарах дохионууд'],
      cta: 'Үнэгүй шалгаад үз',
      theme: 'violet',
    }),
  },
  {
    id: 'couple',
    name: 'Хосуудад',
    content: () => ({
      eyebrow: 'Хосуудад зориулсан',
      title: 'Та хоёр зөв замаар явж байна уу?',
      items: ['Та хоёрын давуу талууд', 'Гол хэв маяг, яагаад ингэдэг вэ', 'Ирэх 7 хоногийн 3 алхам'],
      cta: '7 минутын шалгалт',
      theme: 'lemon',
    }),
  },
  {
    id: 'offer',
    name: 'Үнэ, санал',
    content: (price) => ({
      eyebrow: 'Хувийн тайлан',
      title: `Харилцааныхаа бүрэн тайлан — ${price}`,
      items: ['Товч дүгнэлт үнэгүй', 'Нэр, утас шаардахгүй', 'Хариулт тань нууцлагдана'],
      cta: 'Одоо эхлэх',
      theme: 'rose',
    }),
  },
]

const FORMATS: CardFormat[] = ['story', 'square', 'link']
const THEMES: { id: CardTheme; label: string }[] = [
  { id: 'violet', label: 'Нил ягаан' },
  { id: 'rose', label: 'Ягаан' },
  { id: 'lemon', label: 'Нимбэг' },
]
const SOURCES = ['facebook', 'instagram', 'tiktok', 'google', 'telegram']

const field = 'mt-1 w-full rounded-xl border border-line bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-clay'

export function CreativeStudio() {
  const { price, currency } = useAppConfig()
  const priceText = formatPrice(price, currency)
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [format, setFormat] = useState<CardFormat>('story')
  const [draft, setDraft] = useState(() => toDraft(TEMPLATES[0].content(priceText)))
  const [source, setSource] = useState('facebook')
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const content: CardContent = useMemo(
    () => ({
      eyebrow: draft.eyebrow || undefined,
      title: draft.title || ' ',
      items: draft.items.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3),
      cta: draft.cta || ' ',
      footnote: draft.footnote || undefined,
      theme: draft.theme,
    }),
    [draft],
  )

  // Re-render the preview shortly after edits stop.
  useEffect(() => {
    let active = true
    let url: string | null = null
    const timer = window.setTimeout(async () => {
      const blob = await canvasToBlob(await renderCard(format, content))
      if (!active) return
      url = URL.createObjectURL(blob)
      setPreview(url)
    }, 200)
    return () => {
      active = false
      window.clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
  }, [format, content])

  function pickTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id) ?? TEMPLATES[0]
    setTemplateId(t.id)
    setDraft(toDraft(t.content(priceText)))
  }

  async function download(formats: CardFormat[]) {
    setBusy(true)
    try {
      for (const f of formats) {
        const blob = await canvasToBlob(await renderCard(f, content))
        downloadBlob(blob, `lemony-${templateId}-${f}.png`)
      }
    } finally {
      setBusy(false)
    }
  }

  const campaign = `${templateId}-${format}`
  const link = useMemo(() => {
    const url = new URL('/', window.location.origin)
    url.searchParams.set('utm_source', source)
    url.searchParams.set('utm_medium', 'paid_social')
    url.searchParams.set('utm_campaign', campaign)
    return url.toString()
  }, [source, campaign])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard blocked — the link stays selectable.
    }
  }

  const { width, height } = CARD_SIZES[format]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-3">
        <label className="block text-xs text-ink-muted">
          Загвар
          <select className={field} value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-xs text-ink-muted">Хэмжээ</p>
          <div role="radiogroup" aria-label="Хэмжээ" className="mt-1 grid grid-cols-3 gap-1 rounded-xl border border-line p-0.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={format === f}
                onClick={() => setFormat(f)}
                className={cn('rounded-lg px-2 py-1.5 text-xs', format === f ? 'bg-clay-soft font-semibold text-clay-dark' : 'text-ink-soft')}
              >
                {CARD_SIZES[f].label}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs text-ink-muted">
          Дээд мөр
          <input className={field} value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} />
        </label>
        <label className="block text-xs text-ink-muted">
          Гарчиг
          <textarea rows={2} className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <label className="block text-xs text-ink-muted">
          Жагсаалт <span className="text-ink-muted/70">(мөр бүр нэг, дээд тал нь 3 · хоосон байж болно)</span>
          <textarea rows={3} className={field} value={draft.items} onChange={(e) => setDraft({ ...draft, items: e.target.value })} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-ink-muted">
            Товчны бичиг
            <input className={field} value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} />
          </label>
          <label className="block text-xs text-ink-muted">
            Доод мөр
            <input className={field} value={draft.footnote} onChange={(e) => setDraft({ ...draft, footnote: e.target.value })} />
          </label>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Өнгө</p>
          <div className="mt-1 flex gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={draft.theme === t.id}
                onClick={() => setDraft({ ...draft, theme: t.id })}
                className={cn('rounded-xl border px-3 py-1.5 text-xs', draft.theme === t.id ? 'border-clay bg-clay-soft text-clay-dark' : 'border-line text-ink-soft')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white/[0.03] p-3">
          <p className="text-xs text-ink-muted">Энэ зарын холбоос (самбарт “{campaign}” гэж харагдана)</p>
          <div className="mt-2 flex gap-2">
            <select aria-label="Эх сурвалж" className="rounded-xl border border-line bg-white/[0.04] px-2 text-xs" value={source} onChange={(e) => setSource(e.target.value)}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-ink-soft select-all">{link}</code>
            <button type="button" onClick={() => void copyLink()} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-line px-2.5 text-xs hover:bg-white/10">
              {copied ? <Check className="size-4 text-sage" /> : <Copy className="size-4" />}
              {copied ? 'Хуулсан' : 'Хуулах'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-3">
        <div
          className="w-full max-w-xs overflow-hidden rounded-2xl border border-line bg-black/30"
          style={{ aspectRatio: `${width} / ${height}`, maxWidth: format === 'link' ? '100%' : format === 'square' ? '20rem' : '16rem' }}
        >
          {preview ? (
            <img src={preview} alt="Зурагны урьдчилсан харагдац" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center">
              <Loader2 className="size-6 animate-spin text-ink-muted" aria-label="Бэлдэж байна" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void download([format])}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Download className="size-4" /> PNG татах
          </button>
          <button
            type="button"
            onClick={() => void download(FORMATS)}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} 3 хэмжээгээр
          </button>
        </div>
      </div>
    </div>
  )
}

function toDraft(c: Omit<CardContent, 'footnote'>) {
  return {
    eyebrow: c.eyebrow ?? '',
    title: c.title,
    items: (c.items ?? []).join('\n'),
    cta: c.cta,
    footnote: `${siteHost()} · 7 минут`,
    theme: c.theme ?? ('violet' as CardTheme),
  }
}

/**
 * Draws Lemony share cards and ad creatives on a <canvas> — no server, no dependencies.
 * Used by the share sheet (a person's strengths) and the owner's creative studio.
 *
 * Formats follow the platforms' recommended sizes:
 *   story  1080×1920  Instagram / Facebook / Messenger stories
 *   square 1080×1080  feed posts and Messenger image messages
 *   link   1200×630   link previews (og:image) and link ads
 */

export type CardFormat = 'story' | 'square' | 'link'
export type CardTheme = 'violet' | 'rose' | 'lemon'

export interface CardContent {
  /** Small line above the title. */
  eyebrow?: string
  title: string
  /** Up to three short lines, shown as checked rows (e.g. strengths). */
  items?: string[]
  /** Call to action in the pill at the bottom. */
  cta: string
  /** Shown under the CTA, e.g. "lemony.mn · 7 минут". */
  footnote?: string
  theme?: CardTheme
}

export const CARD_SIZES: Record<CardFormat, { width: number; height: number; label: string }> = {
  story: { width: 1080, height: 1920, label: 'Story 1080×1920' },
  square: { width: 1080, height: 1080, label: 'Пост 1080×1080' },
  link: { width: 1200, height: 630, label: 'Линк 1200×630' },
}

const FONT = 'Montserrat, "Segoe UI", system-ui, sans-serif'
const INK = '#f4f2ff'
const INK_SOFT = '#cfc9ea'

/** Background glows per theme: [color, x, y, radius] as fractions of the canvas. */
const THEMES: Record<CardTheme, { glows: [string, number, number, number][]; accent: [string, string] }> = {
  violet: {
    glows: [
      ['rgba(139,92,246,0.55)', 0.1, 0.12, 0.75],
      ['rgba(236,72,153,0.38)', 0.95, 0.55, 0.65],
      ['rgba(250,204,21,0.22)', 0.2, 1.0, 0.6],
    ],
    accent: ['#8b5cf6', '#ec4899'],
  },
  rose: {
    glows: [
      ['rgba(236,72,153,0.55)', 0.85, 0.1, 0.75],
      ['rgba(139,92,246,0.4)', 0.05, 0.6, 0.65],
      ['rgba(251,146,60,0.22)', 0.8, 1.0, 0.6],
    ],
    accent: ['#ec4899', '#f97316'],
  },
  lemon: {
    glows: [
      ['rgba(250,204,21,0.42)', 0.15, 0.08, 0.7],
      ['rgba(236,72,153,0.35)', 0.95, 0.45, 0.6],
      ['rgba(139,92,246,0.42)', 0.1, 0.95, 0.7],
    ],
    accent: ['#f59e0b', '#ec4899'],
  },
}

/** The Lemony mark (same geometry as components/layout/LemonMark.tsx) as an SVG string. */
function lemonSvg(): string {
  const lines = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    const [x1, y1, x2, y2] = [20 + Math.cos(a) * 4.5, 20 + Math.sin(a) * 4.5, 20 + Math.cos(a) * 14, 20 + Math.sin(a) * 14]
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fffbeb" stroke-width="1.6" stroke-linecap="round"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="200" height="200">
    <defs><linearGradient id="r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
    <circle cx="20" cy="20" r="18.5" fill="url(#r)"/><circle cx="20" cy="20" r="15.5" fill="#fffbeb"/><circle cx="20" cy="20" r="14" fill="#fde68a"/>
    ${lines}
    <path d="M20 24.2c-3.6-2.3-5.3-4.2-5.3-6.2 0-1.6 1.2-2.8 2.7-2.8 1.1 0 2 .6 2.6 1.5.6-.9 1.5-1.5 2.6-1.5 1.5 0 2.7 1.2 2.7 2.8 0 2-1.7 3.9-5.3 6.2z" fill="#ec4899"/>
  </svg>`
}

let logoPromise: Promise<HTMLImageElement> | null = null
function loadLogo(): Promise<HTMLImageElement> {
  logoPromise ??= new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(lemonSvg())}`
  })
  return logoPromise
}

/** Canvas can't wait for web fonts itself — load the weights (with Cyrillic glyphs) first. */
async function loadFonts() {
  if (!('fonts' in document)) return
  await Promise.all(['500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 40px Montserrat`, 'Өө Үү Lemony')))
}

/** Split text into lines that fit maxWidth (words longer than a line are kept whole). */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Largest font size (down to min) at which text fits in maxLines; overflowing text is ellipsised. */
function fitText(ctx: CanvasRenderingContext2D, text: string, weight: number, max: number, min: number, width: number, maxLines: number) {
  for (let size = max; size >= min; size -= 2) {
    ctx.font = `${weight} ${size}px ${FONT}`
    const lines = wrapLines(ctx, text, width)
    if (lines.length <= maxLines) return { size, lines }
  }
  ctx.font = `${weight} ${min}px ${FONT}`
  const lines = wrapLines(ctx, text, width).slice(0, maxLines)
  lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s,.;:—-]+$/, '')}…`
  return { size: min, lines }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, theme: CardTheme) {
  ctx.fillStyle = '#0c0a18'
  ctx.fillRect(0, 0, w, h)
  const scale = Math.max(w, h)
  for (const [color, fx, fy, fr] of THEMES[theme].glows) {
    const g = ctx.createRadialGradient(fx * w, fy * h, 0, fx * w, fy * h, fr * scale)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(12,10,24,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
}

/** Layout constants per format (px on the full-size canvas). */
function layout(format: CardFormat) {
  switch (format) {
    case 'story':
      // Instagram covers ~250px top and ~340px bottom with its UI — content stays inside.
      return { pad: 96, top: 250, bottom: 1920 - 330, logo: 84, eyebrow: 40, title: [96, 60], titleLines: 4, item: 44, itemGap: 26, cta: 44, foot: 32 }
    case 'square':
      return { pad: 84, top: 84, bottom: 1080 - 84, logo: 64, eyebrow: 32, title: [76, 48], titleLines: 3, item: 34, itemGap: 18, cta: 36, foot: 26 }
    case 'link':
      return { pad: 72, top: 64, bottom: 630 - 60, logo: 52, eyebrow: 26, title: [64, 40], titleLines: 3, item: 26, itemGap: 12, cta: 28, foot: 22 }
  }
}

export async function renderCard(format: CardFormat, content: CardContent): Promise<HTMLCanvasElement> {
  await loadFonts()
  const logo = await loadLogo()
  const { width: w, height: h } = CARD_SIZES[format]
  const L = layout(format)
  const theme = content.theme ?? 'violet'
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.textBaseline = 'alphabetic'

  drawBackground(ctx, w, h, theme)

  // The link format puts the text left and leaves the right side to the brand.
  const textWidth = format === 'link' ? w * 0.62 - L.pad : w - L.pad * 2
  const x = L.pad

  // Brand row
  ctx.drawImage(logo, x, L.top, L.logo, L.logo)
  ctx.font = `800 ${Math.round(L.logo * 0.52)}px ${FONT}`
  ctx.fillStyle = INK
  ctx.fillText('Lemony', x + L.logo + L.logo * 0.28, L.top + L.logo * 0.68)

  // Bottom block (measured first so the middle can use the remaining space)
  ctx.font = `700 ${L.cta}px ${FONT}`
  const ctaLines = wrapLines(ctx, content.cta, textWidth - L.cta * 1.6).slice(0, 2)
  const ctaLineH = L.cta * 1.25
  const ctaH = ctaLines.length * ctaLineH + L.cta * 1.1
  const footH = content.footnote ? L.foot * 2.2 : 0
  const ctaY = L.bottom - footH - ctaH

  // Eyebrow shrinks a little, then wraps to a second line, rather than getting cut off.
  const eyebrowFit = content.eyebrow ? fitText(ctx, content.eyebrow, 600, L.eyebrow, Math.round(L.eyebrow * 0.8), textWidth, 2) : null
  const eyebrowH = eyebrowFit ? eyebrowFit.lines.length * eyebrowFit.size * 1.3 + L.eyebrow * 0.7 : 0

  // Title + items must fit between the brand row and the CTA (the link format is short):
  // drop list items from the end first, then shrink the title.
  const areaTop = L.top + L.logo + L.item
  const available = ctaY - L.item - areaTop
  const measure = (items: string[], titleMax: number) => {
    const titleFit = fitText(ctx, content.title, 800, titleMax, L.title[1], textWidth, L.titleLines)
    ctx.font = `600 ${L.item}px ${FONT}`
    const itemRows = items.map((t) => wrapLines(ctx, t, textWidth - L.item * 3).slice(0, 2))
    const itemH = itemRows.reduce((sum, rows) => sum + rows.length * L.item * 1.25 + L.item * 1.1, 0) + L.itemGap * Math.max(0, items.length - 1)
    const blockH = eyebrowH + titleFit.lines.length * titleFit.size * 1.15 + (items.length ? L.item * 1.4 + itemH : 0)
    return { titleFit, itemRows, blockH, items }
  }
  let fit = measure((content.items ?? []).filter(Boolean).slice(0, 3), L.title[0])
  for (let titleMax = L.title[0]; fit.blockH > available; ) {
    if (fit.items.length > 0) fit = measure(fit.items.slice(0, -1), titleMax)
    else if (titleMax > L.title[1]) fit = measure([], (titleMax -= 4))
    else break
  }
  const { titleFit, itemRows, blockH, items } = fit
  const titleLineH = titleFit.size * 1.15
  let y = Math.max(areaTop, areaTop + (available - blockH) / 2)

  if (eyebrowFit) {
    ctx.font = `600 ${eyebrowFit.size}px ${FONT}`
    ctx.fillStyle = '#c4b5fd'
    eyebrowFit.lines.forEach((line, i) => ctx.fillText(line, x, y + eyebrowFit.size + i * eyebrowFit.size * 1.3))
    y += eyebrowH
  }

  ctx.font = `800 ${titleFit.size}px ${FONT}`
  ctx.fillStyle = INK
  for (const line of titleFit.lines) {
    y += titleLineH
    ctx.fillText(line, x, y - titleFit.size * 0.15)
  }

  if (items.length) {
    y += L.item * 1.4
    itemRows.forEach((rows) => {
      const rowH = rows.length * L.item * 1.25 + L.item * 1.1
      roundRect(ctx, x, y, textWidth, rowH, L.item * 0.6)
      ctx.fillStyle = 'rgba(255,255,255,0.07)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 2
      ctx.stroke()
      // Check mark in a teal circle
      const cx = x + L.item * 1.1
      const cy = y + rowH / 2
      ctx.beginPath()
      ctx.arc(cx, cy, L.item * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = '#5eead4'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - L.item * 0.22, cy)
      ctx.lineTo(cx - L.item * 0.05, cy + L.item * 0.17)
      ctx.lineTo(cx + L.item * 0.24, cy - L.item * 0.16)
      ctx.strokeStyle = '#0c0a18'
      ctx.lineWidth = Math.max(3, L.item * 0.1)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.font = `600 ${L.item}px ${FONT}`
      ctx.fillStyle = INK
      rows.forEach((row, r) => ctx.fillText(row, x + L.item * 2.1, y + L.item * 0.55 + (r + 1) * L.item * 1.25 - L.item * 0.2))
      y += rowH + L.itemGap
    })
  }

  // CTA pill
  ctx.font = `700 ${L.cta}px ${FONT}`
  const pillW = Math.min(textWidth, Math.max(...ctaLines.map((l) => ctx.measureText(l).width)) + L.cta * 1.6)
  const grad = ctx.createLinearGradient(x, 0, x + pillW, 0)
  grad.addColorStop(0, THEMES[theme].accent[0])
  grad.addColorStop(1, THEMES[theme].accent[1])
  roundRect(ctx, x, ctaY, pillW, ctaH, Math.min(ctaH / 2, L.cta * 1.2))
  ctx.fillStyle = grad
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctaLines.forEach((line, i) => ctx.fillText(line, x + L.cta * 0.8, ctaY + L.cta * 0.55 + (i + 1) * ctaLineH - L.cta * 0.25))

  if (content.footnote) {
    ctx.font = `500 ${L.foot}px ${FONT}`
    ctx.fillStyle = INK_SOFT
    ctx.fillText(content.footnote, x, L.bottom - L.foot * 0.4)
  }

  // Link format: large mark on the right as the visual anchor.
  if (format === 'link') {
    const size = h * 0.56
    ctx.globalAlpha = 0.95
    ctx.drawImage(logo, w - size - L.pad * 0.9, (h - size) / 2, size, size)
    ctx.globalAlpha = 1
  }

  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'))
}

/** Offer a file download (works in normal browsers; in-app browsers may block it). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

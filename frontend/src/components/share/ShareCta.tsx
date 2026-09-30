import { Share2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { Track } from '../../data/types'
import type { SharePlacement } from '../../lib/share'
import { Button } from '../ui/Button'
import { ShareSheet } from './ShareSheet'

const COPY: Record<SharePlacement, { title: string; text: string; button: string }> = {
  teaser: {
    title: 'Давуу талаа хуваалцаарай',
    text: 'Story эсвэл Messenger-ээр найзууддаа илгээгээд, тэд ч гэсэн харилцаагаа шалгаад үзэг.',
    button: 'Давуу талаа хуваалцах',
  },
  report: {
    title: 'Тустай байсан уу? Найздаа санал болгоорой',
    text: 'Таны давуу талуудаар гоё зураг бэлдлээ — Story, Messenger эсвэл пост болгон хуваалцаарай.',
    button: 'Хуваалцах',
  },
}

export function ShareCta({ placement, flow, strengths, className }: { placement: SharePlacement; flow: Track; strengths: string[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const copy = COPY[placement]
  return (
    <section className={className}>
      <div className="rounded-4xl border border-line bg-gradient-to-br from-violet-500/15 via-pink-500/10 to-yellow-400/10 p-6 text-center sm:p-8">
        <h2 className="font-display text-xl font-semibold">{copy.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{copy.text}</p>
        <Button variant="secondary" onClick={() => setOpen(true)} className="mt-5">
          <Share2 className="size-4" /> {copy.button}
        </Button>
      </div>
      <ShareSheet open={open} onClose={close} placement={placement} flow={flow} strengths={strengths} />
    </section>
  )
}

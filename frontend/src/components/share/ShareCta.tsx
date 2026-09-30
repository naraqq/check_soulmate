import { Share2, Sparkles, Users } from 'lucide-react'
import { useCallback, useState } from 'react'
import type { LoveStyle } from '../../data/loveStyles'
import type { Track } from '../../data/types'
import type { SharePlacement } from '../../lib/share'
import { Button } from '../ui/Button'
import { ShareSheet } from './ShareSheet'

/**
 * Reveals the person's love style (a small free bonus about *them*) and offers to share it,
 * or to invite a friend / the other person privately. Without a known love style on this
 * device, it offers the invites only.
 */
export function ShareCta({
  placement,
  flow,
  loveStyle,
  className,
}: {
  placement: SharePlacement
  flow: Track
  loveStyle: LoveStyle | null
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <section className={className}>
      <div className="rounded-4xl border border-line bg-gradient-to-br from-violet-500/15 via-pink-500/10 to-yellow-400/10 p-6 text-center sm:p-8">
        {loveStyle ? (
          <>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-clay-dark">
              <Sparkles className="size-3.5" aria-hidden /> Таны хайрын хэв маяг
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold">{loveStyle.name}</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-soft">{loveStyle.description}</p>
            <Button variant="secondary" onClick={() => setOpen(true)} className="mt-5">
              <Share2 className="size-4" /> Хуваалцах эсвэл найзаа урих
            </Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-semibold">Тустай байсан уу? Найзаа урих</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">Найзаа эсвэл нөгөө хүнээ урьж, тус тусдаа хийгээд хамтдаа ярилцаарай.</p>
            <Button variant="secondary" onClick={() => setOpen(true)} className="mt-5">
              <Users className="size-4" /> Урих
            </Button>
          </>
        )}
      </div>
      <ShareSheet open={open} onClose={close} placement={placement} flow={flow} loveStyle={loveStyle} />
    </section>
  )
}

import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/format'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl border border-line bg-paper p-6 shadow-soft backdrop-blur-md sm:p-8', className)} {...props} />
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs font-semibold uppercase tracking-[0.14em] text-clay', className)} {...props} />
}

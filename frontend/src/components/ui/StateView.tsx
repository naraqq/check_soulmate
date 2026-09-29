import { AlertCircle, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './Card'

export function LoadingView({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center px-6 text-center animate-fade-in" role="status">
      <div className="relative mb-6 grid size-16 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-clay/15" />
        <span className="grid size-14 place-items-center rounded-full bg-paper shadow-soft">
          <Loader2 className="size-6 animate-spin text-clay" aria-hidden />
        </span>
      </div>
      <h2 className="font-display text-2xl font-semibold text-balance">{title}</h2>
      {message && <p className="mt-2 max-w-sm text-ink-soft">{message}</p>}
    </div>
  )
}

export function ErrorView({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 animate-fade-up" role="alert">
      <Card className="text-center">
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-clay-soft text-clay">
          <AlertCircle className="size-6" aria-hidden />
        </span>
        <h2 className="font-display text-2xl font-semibold text-balance">{title}</h2>
        <p className="mt-3 text-ink-soft">{message}</p>
        {action && <div className="mt-6 flex flex-col items-center gap-3">{action}</div>}
      </Card>
    </div>
  )
}

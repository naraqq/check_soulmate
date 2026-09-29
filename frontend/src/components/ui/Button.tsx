import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '../../lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-glow hover:brightness-110 hover:shadow-[0_14px_48px_-10px_rgb(192_38_211/0.6)]',
  secondary: 'bg-paper text-ink border border-line backdrop-blur hover:border-white/25 hover:bg-white/10',
  ghost: 'text-ink-soft hover:text-ink hover:bg-sand/60',
  quiet: 'text-ink-muted underline-offset-4 hover:text-ink hover:underline',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-14 px-7 text-base',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function ButtonLink({ variant = 'primary', size = 'md', className, children, ...props }: CommonProps & LinkProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  )
}

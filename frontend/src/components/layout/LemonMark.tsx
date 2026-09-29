import { useId } from 'react'

/** Lemony's mark: a lemon slice with a small heart at its centre. */
export function LemonMark({ className }: { className?: string }) {
  const id = useId()
  const segments = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)

  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-rind`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill={`url(#${id}-rind)`} />
      <circle cx="20" cy="20" r="15.5" fill="#fffbeb" />
      <circle cx="20" cy="20" r="14" fill="#fde68a" />
      {segments.map((a) => (
        <line
          key={a}
          x1={20 + Math.cos(a) * 4.5}
          y1={20 + Math.sin(a) * 4.5}
          x2={20 + Math.cos(a) * 14}
          y2={20 + Math.sin(a) * 14}
          stroke="#fffbeb"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ))}
      <path d="M20 24.2c-3.6-2.3-5.3-4.2-5.3-6.2 0-1.6 1.2-2.8 2.7-2.8 1.1 0 2 .6 2.6 1.5.6-.9 1.5-1.5 2.6-1.5 1.5 0 2.7 1.2 2.7 2.8 0 2-1.7 3.9-5.3 6.2z" fill="#ec4899" />
    </svg>
  )
}

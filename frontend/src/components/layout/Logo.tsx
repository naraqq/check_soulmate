import { Link } from 'react-router'

export function Logo() {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="Soulmate Check — нүүр хуудас">
      <span className="relative inline-flex h-7 w-10 items-center" aria-hidden>
        <span className="absolute left-0 size-7 rounded-full border-[2.5px] border-violet-400 transition-transform group-hover:-translate-x-0.5" />
        <span className="absolute left-3 size-7 rounded-full border-[2.5px] border-pink-400/90 transition-transform group-hover:translate-x-0.5" />
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight">Soulmate Check</span>
    </Link>
  )
}

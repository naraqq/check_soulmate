import { Link } from 'react-router'
import { LemonMark } from './LemonMark'

export function Logo() {
  return (
    <Link to="/" className="group inline-flex items-center gap-2" aria-label="Lemony — нүүр хуудас">
      <LemonMark className="size-8 transition-transform duration-500 group-hover:rotate-45" />
      <span className="font-display text-xl font-bold tracking-tight">Lemony</span>
    </Link>
  )
}

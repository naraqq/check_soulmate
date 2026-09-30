import type { ReactNode } from 'react'

import { SUPPORT_URL } from '../../lib/support'

export function SupportLink({ children = 'Facebook хуудсаар холбогдох', className = 'underline underline-offset-4 hover:text-ink' }: { children?: ReactNode; className?: string }) {
  return <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
}

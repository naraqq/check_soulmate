import { SupportLink } from '../ui/SupportLink'
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Logo } from './Logo'

/** Page chrome: ambient background, content, and a footer (hidden while answering). */
export function SiteLayout() {
  const { pathname } = useLocation()
  const focusMode = pathname === '/check'

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      {/* Slow-moving aurora glows behind every page. Smaller on phones, and nothing pinned to the bottom edge. */}
      <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 size-[300px] rounded-full bg-violet-600/20 blur-[90px] animate-float sm:-top-40 sm:-left-32 sm:size-[520px] sm:blur-[120px]" />
        <div className="absolute top-1/4 -right-32 size-[280px] rounded-full bg-fuchsia-500/12 blur-[90px] animate-float [animation-delay:-5s] sm:top-1/3 sm:-right-40 sm:size-[480px] sm:blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 hidden size-[520px] rounded-full bg-indigo-500/12 blur-[130px] animate-float [animation-delay:-9s] sm:block" />
        <div className="absolute top-1/2 right-1/5 hidden size-[360px] rounded-full bg-yellow-400/[0.07] blur-[110px] animate-float [animation-delay:-3s] sm:block" />
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      {!focusMode && (
        <footer className="no-print border-t border-line/70 bg-black/20">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-sm text-ink-muted sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <Logo />
              <nav className="flex flex-wrap gap-6">
                <Link to="/privacy" className="hover:text-ink">
                  Нууцлалын бодлого
                </Link>
                <Link to="/terms" className="hover:text-ink">
                  Үйлчилгээний нөхцөл
                </Link>
                <SupportLink className="hover:text-ink">Холбоо барих</SupportLink>
              </nav>
            </div>
            <div className="flex flex-col justify-between gap-2 sm:flex-row">
              <p>Харилцаа бүрт амттай ч, исгэлэн ч мөч бий.</p>
              <p>© {new Date().getFullYear()} lemony.mn</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

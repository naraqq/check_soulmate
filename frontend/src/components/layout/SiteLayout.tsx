import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Logo } from './Logo'

/** Standard page chrome: header, content, footer with the informational disclaimer. */
export function SiteLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      {/* Slow-moving aurora glows behind every page. */}
      <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 size-[520px] rounded-full bg-violet-600/20 blur-[120px] animate-float" />
        <div className="absolute top-1/3 -right-40 size-[480px] rounded-full bg-fuchsia-500/12 blur-[120px] animate-float [animation-delay:-5s]" />
        <div className="absolute -bottom-40 left-1/4 size-[520px] rounded-full bg-indigo-500/12 blur-[130px] animate-float [animation-delay:-9s]" />
        <div className="absolute top-2/3 right-1/5 size-[360px] rounded-full bg-yellow-400/[0.07] blur-[110px] animate-float [animation-delay:-3s]" />
      </div>

      <header className="no-print sticky top-0 z-30 border-b border-line/60 bg-cream/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          {pathname === '/' && (
            <Link
              to="/check"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
            >
              Эхлэх
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="no-print border-t border-line/70 bg-black/20">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 text-sm text-ink-muted sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Logo />
            <nav className="flex gap-6">
              <Link to="/privacy" className="hover:text-ink">
                Нууцлалын бодлого
              </Link>
              <Link to="/terms" className="hover:text-ink">
                Үйлчилгээний нөхцөл
              </Link>
            </nav>
          </div>
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <p>Харилцаа бүрт амттай ч, исгэлэн ч мөч бий.</p>
            <p>© {new Date().getFullYear()} lemony.mn</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

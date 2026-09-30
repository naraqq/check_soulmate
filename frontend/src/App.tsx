import { createBrowserRouter, RouterProvider } from 'react-router'
import { Button } from './components/ui/Button'
import { ErrorView } from './components/ui/StateView'
import { SupportLink } from './components/ui/SupportLink'
import { SiteLayout } from './components/layout/SiteLayout'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    errorElement: <ErrorView title="Хуудсыг ачаалж чадсангүй" message="Хуудсаа шинэчлээд дахин оролдоорой. " action={<><Button onClick={() => window.location.reload()}>Дахин ачаалах</Button><SupportLink>Тусламж авах</SupportLink></>} />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/check', lazy: () => import('./pages/CheckPage').then((m) => ({ Component: m.CheckPage })) },
      { path: '/complete', lazy: () => import('./pages/CompletePage').then((m) => ({ Component: m.CompletePage })) },
      { path: '/payment/:token', lazy: () => import('./pages/PaymentPage').then((m) => ({ Component: m.PaymentPage })) },
      { path: '/report/:token', lazy: () => import('./pages/ReportPage').then((m) => ({ Component: m.ReportPage })) },
      { path: '/shared/:shareToken', lazy: () => import('./pages/SharedReportPage').then((m) => ({ Component: m.SharedReportPage })) },
      // A friend guesses someone's love style (the code carries the answer; nothing is stored).
      { path: '/guess/:code', lazy: () => import('./pages/GuessPage').then((m) => ({ Component: m.GuessPage })) },
      { path: '/privacy', lazy: () => import('./pages/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })) },
      { path: '/terms', lazy: () => import('./pages/TermsPage').then((m) => ({ Component: m.TermsPage })) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Owner-only analytics, outside the site chrome and loaded on demand (not in the visitor bundle).
  { path: '/admin', lazy: () => import('./pages/AdminPage').then((m) => ({ Component: m.AdminPage })) },
])

export function App() {
  return <RouterProvider router={router} />
}

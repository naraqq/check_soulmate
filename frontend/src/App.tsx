import { createBrowserRouter, RouterProvider } from 'react-router'
import { SiteLayout } from './components/layout/SiteLayout'
import { CheckPage } from './pages/CheckPage'
import { CompletePage } from './pages/CompletePage'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PaymentPage } from './pages/PaymentPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { ReportPage } from './pages/ReportPage'
import { TermsPage } from './pages/TermsPage'

const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/check', element: <CheckPage /> },
      { path: '/complete', element: <CompletePage /> },
      { path: '/payment/:token', element: <PaymentPage /> },
      { path: '/report/:token', element: <ReportPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}

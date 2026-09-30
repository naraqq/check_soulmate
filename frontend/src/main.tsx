import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { captureAttribution } from './lib/analytics'

// Remember where this visitor came from (UTM / referrer) before any page changes the URL.
captureAttribution()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

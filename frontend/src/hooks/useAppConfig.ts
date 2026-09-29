import { useEffect, useState } from 'react'
import { api, type AppConfig } from '../lib/api'

// The backend is authoritative for price; the env value only avoids a flash of empty UI.
const fallback: AppConfig = {
  price: Number(import.meta.env.VITE_REPORT_PRICE ?? 7900),
  currency: import.meta.env.VITE_REPORT_CURRENCY ?? 'MNT',
}

let cached: AppConfig | null = null
let inflight: Promise<AppConfig> | null = null

export function useAppConfig(): AppConfig {
  const [config, setConfig] = useState<AppConfig>(cached ?? fallback)

  useEffect(() => {
    if (cached) return
    inflight ??= api.config().then((c) => (cached = c))
    inflight.then(setConfig).catch(() => {
      inflight = null // keep the fallback; retry on next mount
    })
  }, [])

  return config
}

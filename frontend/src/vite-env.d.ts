/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin. Empty = same origin (/api). */
  readonly VITE_API_BASE_URL?: string
  /** Fallback display price used only until /api/config responds. */
  readonly VITE_REPORT_PRICE?: string
  readonly VITE_REPORT_CURRENCY?: string
  /** Optional public Facebook App ID — enables Messenger's send dialog on computers. */
  readonly VITE_FACEBOOK_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

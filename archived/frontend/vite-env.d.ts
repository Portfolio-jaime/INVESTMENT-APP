/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_MARKET_DATA_URL: string
  readonly VITE_PORTFOLIO_URL: string
  readonly VITE_ANALYSIS_URL: string
  readonly VITE_PREDICTIONS_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_DEBUG: string
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_UPDATE_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
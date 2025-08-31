/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly BASE_URL: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly SSR: boolean
  // 自定義環境變數可以在此處添加
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
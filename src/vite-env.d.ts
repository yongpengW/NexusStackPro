/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
  /** 当前环境标识 */
  readonly VITE_APP_ENV: 'development' | 'test' | 'staging' | 'production'
  /** API 请求基础路径 */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/* eslint-disable react-refresh/only-export-components -- 入口文件含未导出的 Root / GlobalAppSetup */
import '@ant-design/v5-patch-for-react-19'
import '@/locales/i18n'
import '@/utils/dateUtils' // 全局初始化 dayjs 插件（utc / timezone / relativeTime）
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntdApp } from 'antd'
import type { Locale } from 'antd/es/locale'
import antdZhCN from 'antd/locale/zh_CN'
import antdEnUS from 'antd/locale/en_US'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { RouterProvider } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { router } from '@/router'
import { setupGlobalApp } from '@/utils/globalApp'
import { ErrorBoundary } from '@/components'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 窗口重新获得焦点时不自动重新请求（管理后台场景通常不需要）
      refetchOnWindowFocus: false,
      // 请求失败重试 1 次（默认 3 次，管理后台减少无效等待）
      retry: 1,
      // 数据在 5 分钟内视为新鲜，不重复请求
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      // mutation 失败不重试
      retry: 0,
    },
  },
})

dayjs.locale('zh-cn')

const antdLocaleMap: Record<string, Locale> = {
  'zh-CN': antdZhCN,
  'en-US': antdEnUS,
}

/**
 * 将 App.useApp() 实例注入到 globalApp，使其可在组件外（如 request.ts）使用
 * 必须是 <AntdApp> 的子组件才能正确获取带主题的实例
 */
const GlobalAppSetup: React.FC = () => {
  const { message, notification } = AntdApp.useApp()
  useEffect(() => {
    setupGlobalApp(message, notification)
  }, [message, notification])
  return null
}

const Root = () => {
  const { i18n } = useTranslation()
  const locale = antdLocaleMap[i18n.language] ?? antdZhCN

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <AntdApp>
        <GlobalAppSetup />
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Root />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

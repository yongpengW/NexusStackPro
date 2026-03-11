import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载全部 env 变量（含无 VITE_ 前缀的，供 proxy 使用）
  const env = loadEnv(mode, process.cwd(), '')
  const isProd = mode === 'production'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // 关键依赖做去重，避免同包多份实例导致运行时异常
      dedupe: ['@ant-design/colors', '@ant-design/fast-color', '@ant-design/icons'],
    },

    server: {
      port: 5173,
      open: true,
      // proxy 仅在有 API_TARGET 时生效（dev / test 模式）
      proxy: env.API_TARGET
        ? {
            '/api': {
              target: env.API_TARGET,
              changeOrigin: true,
              // 后端路由本身带 /api 前缀，不做路径重写
              secure: false, // 允许自签名证书（本地 https dev 服务）
            },
          }
        : undefined,
    },

    build: {
      // production 输出 dist，其他环境输出 dist-{mode} 以便区分产物
      outDir: isProd ? 'dist' : `dist-${mode}`,
      // 非生产环境保留 sourcemap 便于调试
      sourcemap: !isProd,
      rollupOptions: {
        output: {
          // 使用函数形式：便于为懒加载的 @ant-design/icons 等指定稳定 chunk 名，利于长期缓存
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('node_modules/react-dom')) return 'vendor-react'
            if (id.includes('node_modules/react-router')) return 'vendor-react'
            if (id.includes('node_modules/react/')) return 'vendor-react'
            if (id.includes('node_modules/antd')) return 'vendor-antd'
            if (id.includes('@ant-design/pro-components')) return 'vendor-antd-pro'
            if (id.includes('@tanstack/react-query-devtools')) return 'vendor-query-devtools'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('i18next') || id.includes('react-i18next') || id.includes('i18next-browser-languagedetector')) return 'vendor-i18n'
            if (id.includes('node_modules/dayjs') || id.includes('node_modules/zustand')) return 'vendor-utils'
            if (id.includes('node_modules/exceljs')) return 'vendor-exceljs'
            if (id.includes('react-organizational-chart')) return 'vendor-org-chart'
          },
        },
      },
    },
  }
})

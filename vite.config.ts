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
          manualChunks: {
            // React 核心：极少变动，长期缓存
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Ant Design 图标：全量引入时体积大，单独拆包便于缓存
            'vendor-antd-icons': ['@ant-design/icons'],
            // Ant Design 组件库：与 Pro 拆开，便于单方升级时缓存不失效
            'vendor-antd': ['antd'],
            'vendor-antd-pro': ['@ant-design/pro-components'],
            // React Query：与 Devtools 拆开（生产构建下 Devtools 通常被 tree-shake）
            'vendor-query': ['@tanstack/react-query'],
            'vendor-query-devtools': ['@tanstack/react-query-devtools'],
            // 国际化
            'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            // 工具库
            'vendor-utils': ['dayjs', 'zustand'],
            // 按需/重量级库：单独 chunk，便于缓存与并行加载
            'vendor-exceljs': ['exceljs'],
            'vendor-org-chart': ['react-organizational-chart'],
          },
        },
      },
    },
  }
})

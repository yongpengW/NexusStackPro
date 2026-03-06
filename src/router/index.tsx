/* eslint-disable react-refresh/only-export-components -- 路由配置含 lazy 组件与 withLazy，非纯组件导出 */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AuthGuard } from './AuthGuard'

// 路由懒加载占位，避免切换页面时白屏
const PageFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 280,
    }}
  >
    <Spin size="large" />
  </div>
)

function withLazy(
  LazyComponent: React.LazyExoticComponent<React.ComponentType>,
) {
  return (
    <Suspense fallback={<PageFallback />}>
      <LazyComponent />
    </Suspense>
  )
}

// ─── 布局（进入主界面后再加载） ─────────────────────────────────────────────
const MainLayout = lazy(() => import('@/layouts/MainLayout'))

// ─── 无需鉴权 / 首屏可能命中 ─────────────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/login'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

// ─── 主界面内页（按需加载） ─────────────────────────────────────────────
const HomePage = lazy(() => import('@/pages/home'))
const AnalysisPage = lazy(() => import('@/pages/analysis'))
const RuleListPage = lazy(() => import('@/pages/list/rule-list'))
const AccountSettingsPage = lazy(() => import('@/pages/account/settings'))

const DashboardAnalysisPage = lazy(() => import('@/pages/dashboard/analysis'))
const DashboardMonitorPage = lazy(() => import('@/pages/dashboard/monitor'))
const DashboardWorkplacePage = lazy(() => import('@/pages/dashboard/workplace'))

const BasicFormPage = lazy(() => import('@/pages/form/basic-form'))
const StepFormPage = lazy(() => import('@/pages/form/step-form'))
const AdvancedFormPage = lazy(() => import('@/pages/form/advanced-form'))

const TableListPage = lazy(() => import('@/pages/list/table-list'))
const BasicListPage = lazy(() => import('@/pages/list/basic-list'))
const CardListPage = lazy(() => import('@/pages/list/card-list'))
const SearchListPage = lazy(() => import('@/pages/list/search'))

const ProfileBasicPage = lazy(() => import('@/pages/profile/basic'))
const ProfileAdvancedPage = lazy(() => import('@/pages/profile/advanced'))

const ResultSuccessPage = lazy(() => import('@/pages/result/success'))
const ResultFailPage = lazy(() => import('@/pages/result/fail'))

const Exception403Page = lazy(() => import('@/pages/exception/403'))
const Exception404Page = lazy(() => import('@/pages/exception/404'))
const Exception500Page = lazy(() => import('@/pages/exception/500'))

const AccountCenterPage = lazy(() => import('@/pages/account/center'))

const RegionPage = lazy(() => import('@/pages/system/region'))
const RolePage = lazy(() => import('@/pages/system/role'))
const MenuPage = lazy(() => import('@/pages/system/menu'))
const UserPage = lazy(() => import('@/pages/system/user'))
const OrgPage = lazy(() => import('@/pages/system/org'))
const PermissionPage = lazy(() => import('@/pages/system/permission'))

export const router = createBrowserRouter([
  {
    path: '/user',
    children: [
      { path: 'login', element: withLazy(LoginPage) },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <Suspense fallback={<PageFallback />}>
          <MainLayout />
        </Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard/analysis" replace /> },
      { path: 'home', element: withLazy(HomePage) },
      { path: 'analysis', element: withLazy(AnalysisPage) },

      {
        path: 'dashboard',
        children: [
          { index: true, element: <Navigate to="/dashboard/analysis" replace /> },
          { path: 'analysis', element: withLazy(DashboardAnalysisPage) },
          { path: 'monitor', element: withLazy(DashboardMonitorPage) },
          { path: 'workplace', element: withLazy(DashboardWorkplacePage) },
        ],
      },

      {
        path: 'form',
        children: [
          { index: true, element: <Navigate to="/form/basic-form" replace /> },
          { path: 'basic-form', element: withLazy(BasicFormPage) },
          { path: 'step-form', element: withLazy(StepFormPage) },
          { path: 'advanced-form', element: withLazy(AdvancedFormPage) },
        ],
      },

      {
        path: 'list',
        children: [
          { index: true, element: <Navigate to="/list/table-list" replace /> },
          { path: 'rule-list', element: withLazy(RuleListPage) },
          { path: 'table-list', element: withLazy(TableListPage) },
          { path: 'basic-list', element: withLazy(BasicListPage) },
          { path: 'card-list', element: withLazy(CardListPage) },
          { path: 'search', element: withLazy(SearchListPage) },
        ],
      },

      {
        path: 'profile',
        children: [
          { index: true, element: <Navigate to="/profile/basic" replace /> },
          { path: 'basic', element: withLazy(ProfileBasicPage) },
          { path: 'advanced', element: withLazy(ProfileAdvancedPage) },
        ],
      },

      {
        path: 'result',
        children: [
          { index: true, element: <Navigate to="/result/success" replace /> },
          { path: 'success', element: withLazy(ResultSuccessPage) },
          { path: 'fail', element: withLazy(ResultFailPage) },
        ],
      },

      {
        path: 'exception',
        children: [
          { index: true, element: <Navigate to="/exception/404" replace /> },
          { path: '403', element: withLazy(Exception403Page) },
          { path: '404', element: withLazy(Exception404Page) },
          { path: '500', element: withLazy(Exception500Page) },
        ],
      },

      {
        path: 'account',
        children: [
          { index: true, element: <Navigate to="/account/center" replace /> },
          { path: 'center', element: withLazy(AccountCenterPage) },
          { path: 'settings', element: withLazy(AccountSettingsPage) },
        ],
      },

      {
        path: 'system',
        children: [
          { index: true, element: <Navigate to="/system/region" replace /> },
          { path: 'region', element: withLazy(RegionPage) },
          { path: 'role', element: withLazy(RolePage) },
          { path: 'menu', element: withLazy(MenuPage) },
          { path: 'user', element: withLazy(UserPage) },
          { path: 'permission', element: withLazy(PermissionPage) },
          { path: 'org', element: withLazy(OrgPage) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: withLazy(NotFoundPage),
  },
])

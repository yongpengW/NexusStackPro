import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import { AuthGuard } from './AuthGuard'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import NotFoundPage from '@/pages/not-found'
import AnalysisPage from '@/pages/analysis'
import RuleListPage from '@/pages/list/rule-list'
import AccountSettingsPage from '@/pages/account/settings'

// Dashboard
import DashboardAnalysisPage from '@/pages/dashboard/analysis'
import DashboardMonitorPage from '@/pages/dashboard/monitor'
import DashboardWorkplacePage from '@/pages/dashboard/workplace'

// Form
import BasicFormPage from '@/pages/form/basic-form'
import StepFormPage from '@/pages/form/step-form'
import AdvancedFormPage from '@/pages/form/advanced-form'

// List
import TableListPage from '@/pages/list/table-list'
import BasicListPage from '@/pages/list/basic-list'
import CardListPage from '@/pages/list/card-list'
import SearchListPage from '@/pages/list/search'

// Profile
import ProfileBasicPage from '@/pages/profile/basic'
import ProfileAdvancedPage from '@/pages/profile/advanced'

// Result
import ResultSuccessPage from '@/pages/result/success'
import ResultFailPage from '@/pages/result/fail'

// Exception
import Exception403Page from '@/pages/exception/403'
import Exception404Page from '@/pages/exception/404'
import Exception500Page from '@/pages/exception/500'

// Account
import AccountCenterPage from '@/pages/account/center'

// System
import RegionPage from '@/pages/system/region'
import RolePage   from '@/pages/system/role'
import MenuPage   from '@/pages/system/menu'
import UserPage   from '@/pages/system/user'
import OrgPage from '@/pages/system/org'

export const router = createBrowserRouter([
  {
    path: '/user',
    children: [
      { path: 'login', element: <LoginPage /> },
    ],
  },
  {
    path: '/',
    element: <AuthGuard><MainLayout /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/dashboard/analysis" replace /> },
      { path: 'home', element: <HomePage /> },
      // 旧路径兼容
      { path: 'analysis', element: <AnalysisPage /> },

      // Dashboard
      {
        path: 'dashboard',
        children: [
          { index: true, element: <Navigate to="/dashboard/analysis" replace /> },
          { path: 'analysis', element: <DashboardAnalysisPage /> },
          { path: 'monitor', element: <DashboardMonitorPage /> },
          { path: 'workplace', element: <DashboardWorkplacePage /> },
        ],
      },

      // Form
      {
        path: 'form',
        children: [
          { index: true, element: <Navigate to="/form/basic-form" replace /> },
          { path: 'basic-form', element: <BasicFormPage /> },
          { path: 'step-form', element: <StepFormPage /> },
          { path: 'advanced-form', element: <AdvancedFormPage /> },
        ],
      },

      // List
      {
        path: 'list',
        children: [
          { index: true, element: <Navigate to="/list/table-list" replace /> },
          { path: 'rule-list', element: <RuleListPage /> },
          { path: 'table-list', element: <TableListPage /> },
          { path: 'basic-list', element: <BasicListPage /> },
          { path: 'card-list', element: <CardListPage /> },
          { path: 'search', element: <SearchListPage /> },
        ],
      },

      // Profile
      {
        path: 'profile',
        children: [
          { index: true, element: <Navigate to="/profile/basic" replace /> },
          { path: 'basic', element: <ProfileBasicPage /> },
          { path: 'advanced', element: <ProfileAdvancedPage /> },
        ],
      },

      // Result
      {
        path: 'result',
        children: [
          { index: true, element: <Navigate to="/result/success" replace /> },
          { path: 'success', element: <ResultSuccessPage /> },
          { path: 'fail', element: <ResultFailPage /> },
        ],
      },

      // Exception
      {
        path: 'exception',
        children: [
          { index: true, element: <Navigate to="/exception/404" replace /> },
          { path: '403', element: <Exception403Page /> },
          { path: '404', element: <Exception404Page /> },
          { path: '500', element: <Exception500Page /> },
        ],
      },

      // Account
      {
        path: 'account',
        children: [
          { index: true, element: <Navigate to="/account/center" replace /> },
          { path: 'center', element: <AccountCenterPage /> },
          { path: 'settings', element: <AccountSettingsPage /> },
        ],
      },

      // System
      {
        path: 'system',
        children: [
          { index: true, element: <Navigate to="/system/region" replace /> },
          { path: 'region', element: <RegionPage /> },
          { path: 'role',   element: <RolePage /> },
          { path: 'menu',   element: <MenuPage /> },
          { path: 'user',   element: <UserPage /> },
          //{ path: 'permission', element: <PermissionPage /> },
          { path: 'org', element: <OrgPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

import {
  HomeOutlined,
  BarChartOutlined,
  TableOutlined,
  UnorderedListOutlined,
  UserOutlined,
  SmileOutlined,
  CrownOutlined,
  DashboardOutlined,
  MonitorOutlined,
  DesktopOutlined,
  FormOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  FileTextOutlined,
  StepForwardOutlined,
  ControlOutlined,
  SettingOutlined,
  ClusterOutlined,
  ApartmentOutlined,
  TeamOutlined,
  AppstoreAddOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

export const useMenuRoutes = () => {
  const { t } = useTranslation()

  return {
    path: '/',
    routes: [
      { path: '/home', name: t('menu.home'), icon: <HomeOutlined /> },
      {
        path: '/dashboard',
        name: t('menu.dashboard'),
        icon: <DashboardOutlined />,
        routes: [
          { path: '/dashboard/analysis', name: t('menu.dashboard.analysis'), icon: <BarChartOutlined /> },
          { path: '/dashboard/monitor', name: t('menu.dashboard.monitor'), icon: <MonitorOutlined /> },
          { path: '/dashboard/workplace', name: t('menu.dashboard.workplace'), icon: <DesktopOutlined /> },
        ],
      },
      {
        path: '/form',
        name: t('menu.form'),
        icon: <FormOutlined />,
        routes: [
          { path: '/form/basic-form', name: t('menu.form.basic-form'), icon: <FileTextOutlined /> },
          { path: '/form/step-form', name: t('menu.form.step-form'), icon: <StepForwardOutlined /> },
          { path: '/form/advanced-form', name: t('menu.form.advanced-form'), icon: <ControlOutlined /> },
        ],
      },
      {
        path: '/list',
        name: t('menu.list'),
        icon: <UnorderedListOutlined />,
        routes: [
          { path: '/list/table-list', name: t('menu.list.table-list'), icon: <TableOutlined /> },
          { path: '/list/basic-list', name: t('menu.list.basic-list'), icon: <OrderedListOutlined /> },
          { path: '/list/card-list', name: t('menu.list.card-list'), icon: <AppstoreOutlined /> },
          { path: '/list/search', name: t('menu.list.search-list'), icon: <UnorderedListOutlined /> },
        ],
      },
      {
        path: '/profile',
        name: t('menu.profile'),
        icon: <ProfileOutlined />,
        routes: [
          { path: '/profile/basic', name: t('menu.profile.basic'), icon: <FileTextOutlined /> },
          { path: '/profile/advanced', name: t('menu.profile.advanced'), icon: <ProfileOutlined /> },
        ],
      },
      {
        path: '/result',
        name: t('menu.result'),
        icon: <CheckCircleOutlined />,
        routes: [
          { path: '/result/success', name: t('menu.result.success'), icon: <CheckCircleOutlined /> },
          { path: '/result/fail', name: t('menu.result.fail'), icon: <WarningOutlined /> },
        ],
      },
      {
        path: '/exception',
        name: t('menu.exception'),
        icon: <WarningOutlined />,
        routes: [
          { path: '/exception/403', name: t('menu.exception.403'), icon: <WarningOutlined /> },
          { path: '/exception/404', name: t('menu.exception.404'), icon: <WarningOutlined /> },
          { path: '/exception/500', name: t('menu.exception.500'), icon: <WarningOutlined /> },
        ],
      },
      {
        path: '/account',
        name: t('menu.account'),
        icon: <UserOutlined />,
        routes: [
          { path: '/account/center', name: t('menu.account.center'), icon: <UserOutlined /> },
          { path: '/account/settings', name: t('menu.account.settings'), icon: <SettingOutlined /> },
        ],
      },
      {
        path: '/system',
        name: t('menu.system'),
        icon: <SettingOutlined />,
        routes: [
          // 区域：地图/楼宇风格
          { path: '/system/region', name: t('menu.system.region'), icon: <ApartmentOutlined /> },
          // 组织架构：集群图标
          { path: '/system/org',    name: t('menu.system.org'),    icon: <ClusterOutlined /> },
          // 角色：多人/团队
          { path: '/system/role',   name: t('menu.system.role'),   icon: <TeamOutlined /> },
          // 菜单：应用/菜单图标
          { path: '/system/menu',   name: t('menu.system.menu'),   icon: <AppstoreAddOutlined /> },
          // 用户：头像图标
          { path: '/system/user',   name: t('menu.system.user'),   icon: <UserOutlined /> },
          // 权限：安全证书图标
          { path: '/system/permission', name: t('menu.system.permission'), icon: <SafetyCertificateOutlined /> },
        ],
      },
    ],
  }
}

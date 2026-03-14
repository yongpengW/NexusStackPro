import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { ProLayout } from '@ant-design/pro-components'
import { LayoutOutlined, SyncOutlined, SunOutlined, MoonOutlined, CompressOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import { useAppStore, type ThemeMode } from '@/store/useAppStore'
import { AvatarDropdown, AvatarName, Footer, SelectLang } from '@/components'
import IconFont from '@/components/IconFont'
import { useMenuRoutes } from '@/config/routes'

function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const userInfo = useAppStore((s) => s.userInfo)
  const iconsModule = useAppStore((s) => s.iconsModule)
  const setIconsModule = useAppStore((s) => s.setIconsModule)
  const themeMode = useAppStore((s) => s.themeMode)
  const setThemeMode = useAppStore((s) => s.setThemeMode)
  const route = useMenuRoutes()
  const [layoutMode, setLayoutMode] = useState<'mix' | 'side' | 'top'>(() => {
    const stored = localStorage.getItem('app_layout_mode') as 'mix' | 'side' | 'top' | null
    return stored ?? 'mix'
  })
  const [collapsed, setCollapsed] = useState(false)

  // 懒加载 @ant-design/icons：进入主布局后再拉取，首屏主包不包含整包 icons
  useEffect(() => {
    if (iconsModule) return
    import('@ant-design/icons').then((m) => {
      setIconsModule(m as unknown as Record<string, ComponentType>)
    })
  }, [iconsModule, setIconsModule])

  // 持久化布局模式到 localStorage，刷新后保持用户选择
  useEffect(() => {
    localStorage.setItem('app_layout_mode', layoutMode)
  }, [layoutMode])

  return (
    <ProLayout
      title="NexusStack"
      logo="/nexusstack-logo.png"
      headerTitleRender={(logo) => (
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {logo}
          <span style={{ display: 'inline-flex', alignItems: 'baseline', fontSize: 22, fontWeight: 600 }}>
            <span style={{ color: '#000' }}>Nexus</span>
            <span style={{ color: '#C22700' }}>Stack</span>
          </span>
        </div>
      )}
      layout={layoutMode}
      route={route}
      location={{ pathname: location.pathname }}
      fixedHeader
      fixSiderbar
      collapsed={collapsed}
      onCollapse={setCollapsed}
      menu={{ locale: false }}
      onMenuHeaderClick={() => navigate('/')}
      menuItemRender={(item, dom) => {
        if (!item.path) return dom

        // 外链菜单：直接使用 a 标签新开页签
        if (item.isExternalLink) {
          return (
            <a
              href={item.path}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {item.icon && <span className="anticon">{item.icon}</span>}
              <span>{item.name}</span>
            </a>
          )
        }

        // mix 布局侧边栏默认不渲染子菜单图标，手动补齐
        return (
          <Link to={item.path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.icon && <span className="anticon">{item.icon}</span>}
            <span>{item.name}</span>
          </Link>
        )
      }}
      avatarProps={{
        src: userInfo?.avatar,
        title: <AvatarName />,
        size: 'small',
        render: () => (
          <AvatarDropdown
            menu
            showName={!(layoutMode === 'side' && collapsed)}
          />
        ),
      }}
      actionsRender={() => [
          <Dropdown
            key="layout-switch"
            arrow
            menu={{
              selectedKeys: [layoutMode],
              onClick: ({ key }) => setLayoutMode(key as 'mix' | 'side' | 'top'),
              items: [
                { key: 'side', label: '右侧导航' },
                { key: 'top', label: '顶部导航' },
                { key: 'mix', label: '混合模式' },
              ],
            }}
          >
            <LayoutOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
          </Dropdown>,
          <Dropdown
            key="theme-switch"
            arrow
            menu={{
              selectedKeys: [themeMode],
              onClick: ({ key }) => setThemeMode(key as ThemeMode),
              items: [
                {
                  key: 'system',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SyncOutlined />
                      <span>跟随系统</span>
                    </span>
                  ),
                },
                {
                  key: 'light',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <SunOutlined />
                      <span>浅色主题</span>
                    </span>
                  ),
                },
                {
                  key: 'dark',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MoonOutlined />
                      <span>暗黑主题</span>
                    </span>
                  ),
                },
                {
                  type: 'divider',
                },
                {
                  key: 'compact',
                  label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CompressOutlined />
                      <span>紧凑模式</span>
                    </span>
                  ),
                },
              ],
            }}
          >
            <IconFont type="icon-theme" style={{ fontSize: 18, cursor: 'pointer' }} />
          </Dropdown>,
          //<Question key="question" />,
          <SelectLang key="lang" />,
          //<Badge key="bell" count={5} size="small">
          //<BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
          //</Badge>,
        ]}
      footerRender={() => <Footer />}
      bgLayoutImgList={[
        {
          src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
          left: 85,
          bottom: 100,
          height: '303px',
        },
        {
          src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
          bottom: -68,
          right: -45,
          height: '303px',
        },
        {
          src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
          bottom: 0,
          left: 0,
          width: '331px',
        },
      ]}
      style={{ minHeight: '100vh' }}
    >
      <Outlet />
    </ProLayout>
  )
}

export default MainLayout
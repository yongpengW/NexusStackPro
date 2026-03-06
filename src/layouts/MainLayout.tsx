import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { ProLayout } from '@ant-design/pro-components'
import { BellOutlined, SettingOutlined } from '@ant-design/icons'
import { Badge } from 'antd'
import { useAppStore } from '@/store/useAppStore'
import { AvatarDropdown, AvatarName, Footer, Question, SelectLang } from '@/components'
import { useMenuRoutes } from '@/config/routes'

const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const userInfo = useAppStore((s) => s.userInfo)
  const route = useMenuRoutes()

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
      layout="mix"
      route={route}
      location={{ pathname: location.pathname }}
      fixedHeader
      fixSiderbar
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
        render: (_, avatarChildren) => (
          <AvatarDropdown menu>{avatarChildren}</AvatarDropdown>
        ),
      }}
      actionsRender={() => [
        <Question key="question" />,
        <SelectLang key="lang" />,
        <Badge key="bell" count={5} size="small">
          <BellOutlined style={{ fontSize: 16, cursor: 'pointer' }} />
        </Badge>,
        <SettingOutlined
          key="setting"
          style={{ fontSize: 16, cursor: 'pointer' }}
          onClick={() => navigate('/account/settings')}
        />,
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
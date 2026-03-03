import {
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  LoginOutlined,
} from '@ant-design/icons'
import { Avatar } from 'antd'
import type { MenuProps } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/useAppStore'
import { signout } from '@/services/auth'
import HeaderDropdown from '../HeaderDropdown'

export type AvatarDropdownProps = {
  menu?: boolean
  children?: React.ReactNode
}

export const AvatarName: React.FC = () => {
  const userInfo = useAppStore((s) => s.userInfo)
  return <span>{userInfo?.userName ?? ''}</span>
}

export const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ menu, children }) => {
  const navigate = useNavigate()
  const userInfo = useAppStore((s) => s.userInfo)
  const clearUserInfo = useAppStore((s) => s.logout)
  const { t } = useTranslation()

  const actionStyle: React.CSSProperties = {
    display: 'flex',
    height: 48,
    alignItems: 'center',
    padding: '0 8px',
    cursor: 'pointer',
    borderRadius: 4,
  }

  if (!userInfo) {
    return (
      <span
        style={{ ...actionStyle, gap: 6 }}
        onClick={() => navigate('/user/login')}
      >
        <LoginOutlined />
        {t('component.avatar.notLogin')}
      </span>
    )
  }

  const menuItems: MenuProps['items'] = [
    ...(menu
      ? [
          {
            key: 'center',
            icon: <UserOutlined />,
            label: t('component.avatar.center'),
          },
          { type: 'divider' as const },
        ]
      : []),
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('component.avatar.settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('component.avatar.logout'),
    },
  ]

  const onMenuClick: MenuProps['onClick'] = async ({ key }) => {
    if (key === 'logout') {
      try {
        // 调用后端退出接口，记录登出状态并失效当前 Token
        await signout()
      } catch {
        // 接口异常时也执行本地登出，避免卡死在前端
      } finally {
        clearUserInfo()
        navigate('/user/login')
      }
      return
    }
    if (key === 'settings') {
      navigate('/account/settings')
      return
    }
    if (key === 'center') {
      navigate('/account/center')
    }
  }

  return (
    <HeaderDropdown
      menu={{ selectedKeys: [], onClick: onMenuClick, items: menuItems }}
    >
      <span style={{ ...actionStyle, gap: 8 }}>
        <Avatar
          size="small"
          src={userInfo.avatar}
          icon={<UserOutlined />}
          alt={userInfo.userName}
        />
        <span>{userInfo.userName}</span>
      </span>
    </HeaderDropdown>
  )
}
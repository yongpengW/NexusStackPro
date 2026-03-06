import type { ReactNode, ComponentType } from 'react'
import * as AntdIcons from '@ant-design/icons'
import { MenuIconType, MenuTreeDto, MenuType } from '@/services/menu'
import { useAppStore } from '@/store/useAppStore'
import { t } from 'i18next'

export interface MenuRouteItem {
  path: string
  name: string
  icon?: ReactNode
  routes?: MenuRouteItem[]
  // 透传部分后端字段，供 menuItemRender 使用
  isExternalLink?: boolean
}

function buildIcon(node: MenuTreeDto): ReactNode | undefined {
  if (!node.icon) return undefined

  if (node.iconType === MenuIconType.Picture) {
    return <img src={node.icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
  }

  const allIcons = AntdIcons as unknown as Record<string, ComponentType>
  const IconComp = allIcons[node.icon]

  if (!IconComp) return undefined

  return <IconComp />
}

function mapMenuTreeToRoutes(nodes: MenuTreeDto[]): MenuRouteItem[] {
  const walk = (node: MenuTreeDto): MenuRouteItem | null => {
    // 只把 子系统/目录/菜单 转成路由，操作按钮不在菜单里展示
    if (!node.isVisible || node.type === MenuType.Operation) {
      return null
    }

    const path = node.url || `/menu/${node.id}`

    const route: MenuRouteItem = {
      path,
      //name: node.name,
      name: t(`menu.${node.code}`),
      icon: buildIcon(node),
      isExternalLink: node.isExternalLink,
    }

    if (node.children && node.children.length > 0) {
      const children = node.children
        .map(walk)
        .filter((x): x is MenuRouteItem => x !== null)

      if (children.length > 0) {
        route.routes = children
      }
    }

    return route
  }

  return nodes
    .map(walk)
    .filter((x): x is MenuRouteItem => x !== null)
}

export const useMenuRoutes = () => {
  const menuTree = useAppStore((s) => s.menus)

  return {
    path: '/',
    routes: mapMenuTreeToRoutes(menuTree),
  }
}

import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAppStore } from '@/store/useAppStore'
import { MenuApi, MenuType, type MenuTreeDto, PlatformType as MenuPlatformType } from '@/services/menu'
import { PermissionApi, type RolePermissionDto } from '@/services/permission'
import { PlatformType as RolePlatformType } from '@/services/role'
import { useAccess } from '@/hooks/useAccess'

function flattenPermissions(list: RolePermissionDto[]): RolePermissionDto[] {
  const result: RolePermissionDto[] = []

  const walk = (nodes: RolePermissionDto[]) => {
    for (const n of nodes) {
      result.push(n)
      if (n.children?.length) {
        walk(n.children)
      }
    }
  }

  walk(list)
  return result
}

function matchMenuCodeByPath(tree: MenuTreeDto[], pathname: string): string | null {
  let bestCode: string | null = null
  let bestPathLength = -1

  const walk = (nodes: MenuTreeDto[]) => {
    for (const n of nodes) {
      if (n.isVisible && n.type !== MenuType.Operation) {
        const path = n.url || `/menu/${n.id}`
        //console.log('path', path);
        //console.log('pathname', pathname);
        if (pathname === path || pathname.startsWith(`${path}/`)) {
          const len = path.length
          if (len > bestPathLength) {
            bestPathLength = len
            bestCode = n.code
          }
        }
      }
      if (n.children?.length) {
        walk(n.children)
      }
    }
  }

  walk(tree)
  return bestCode
}

const ROUTE_WHITELIST: string[] = ['/exception/403', '/exception/404', '/exception/500']

/**
 * 路由守卫：未登录时重定向到登录页，并记录来源路径（from），
 * 登录成功后可从 location.state.from 跳回原页面。
 * 已登录但菜单为空时（如刷新页面）会拉取用户菜单，避免侧栏空白。
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token)
  const menus = useAppStore((s) => s.menus)
  const setMenus = useAppStore((s) => s.setMenus)
  const setAccessPermissions = useAppStore((s) => s.setAccessPermissions)
  const location = useLocation()
  const { initialized: accessInitialized, hasMenu } = useAccess()

  useEffect(() => {
    if (!token || menus.length > 0) return
    MenuApi.getUserTree(MenuPlatformType.Pc)
      .then(setMenus)
      .catch(() => { /* 失败时保持空菜单，由主界面处理 */ })
  }, [token, menus.length, setMenus])

  // 登录后首次进入主界面时拉取当前用户权限，并写入全局 Store，供 useAccess 使用。
  useEffect(() => {
    if (!token || accessInitialized) return

    PermissionApi.getCurrentUserPermission(RolePlatformType.Pc)
      .then((data) => {
        if (!data || data.length === 0) {
          setAccessPermissions({ menuCodes: [], operationCodes: [] })
          return
        }

        const all = flattenPermissions(data)
        const allCodes = new Set<string>()
        const opCodes = new Set<string>()

        for (const item of all) {
          if (item.menuCode) {
            allCodes.add(item.menuCode)
            if (item.type === MenuType.Operation) {
              opCodes.add(item.menuCode)
            }
          }
        }

        setAccessPermissions({
          menuCodes: Array.from(allCodes),
          operationCodes: Array.from(opCodes),
        })
      })
      .catch(() => {
        // 失败时也视为已初始化，避免无限重试；权限集合为空将导致 hasMenu 一律返回 false
        setAccessPermissions({ menuCodes: [], operationCodes: [] })
      })
  }, [token, accessInitialized, setAccessPermissions])

  if (!token) {
    return <Navigate to="/user/login" state={{ from: location }} replace />
  }

  // 已登录但菜单或权限尚未拉取完时，不渲染子路由，避免先展示再被 403 的闪屏
  if (menus.length === 0 || !accessInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    )
  }

  // 路由级权限校验：仅允许访问出现在用户菜单中的 url 且 useAccess.hasMenu(code) 为 true；白名单与根路径放行
  const pathname = location.pathname
  const isWhitelisted = ROUTE_WHITELIST.some((w) => pathname.startsWith(w))
  if (!isWhitelisted && pathname !== '/') {
    const code = matchMenuCodeByPath(menus, pathname)
    if (!code || !hasMenu(code)) {
      return <Navigate to="/exception/403" replace />
    }
  }

  return <>{children}</>
}

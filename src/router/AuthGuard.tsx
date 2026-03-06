import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { MenuApi, PlatformType } from '@/services/menu'

/**
 * 路由守卫：未登录时重定向到登录页，并记录来源路径（from），
 * 登录成功后可从 location.state.from 跳回原页面。
 * 已登录但菜单为空时（如刷新页面）会拉取用户菜单，避免侧栏空白。
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token)
  const menus = useAppStore((s) => s.menus)
  const setMenus = useAppStore((s) => s.setMenus)
  const location = useLocation()

  useEffect(() => {
    if (!token || menus.length > 0) return
    MenuApi.getUserTree(PlatformType.Pc)
      .then(setMenus)
      .catch(() => { /* 失败时保持空菜单，由主界面处理 */ })
  }, [token, menus.length, setMenus])

  if (!token) {
    return <Navigate to="/user/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

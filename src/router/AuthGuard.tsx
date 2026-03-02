import { Navigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

/**
 * 路由守卫：未登录时重定向到登录页，并记录来源路径（from），
 * 登录成功后可从 location.state.from 跳回原页面。
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/user/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { LoginResult } from '@/services/auth'

// ─── localStorage key ────────────────────────────────────────────────────────
const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserInfo = Pick<LoginResult, 'userId' | 'userName' | 'email'> & {
  /** 头像 URL，由后端扩展字段或个人设置填充 */
  avatar?: string
}

interface AppState {
  /** 全局 loading 状态 */
  loading: boolean
  /** 登录用户信息 */
  userInfo: UserInfo | null
  /** 访问 token */
  token: string | null
  /** 刷新 token */
  refreshToken: string | null

  setLoading: (loading: boolean) => void
  /** 登录成功后统一写入用户信息和双 token */
  setLoginData: (result: LoginResult) => void
  /** 登出：清空状态与 localStorage */
  logout: () => void
}

// ─── 初始化时从 localStorage 恢复状态 ────────────────────────────────────────

function restoreUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_INFO_KEY)
    return raw ? (JSON.parse(raw) as UserInfo) : null
  } catch {
    return null
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      loading: false,
      userInfo: restoreUserInfo(),
      token: localStorage.getItem(TOKEN_KEY),
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setLoginData: (result) => {
        const userInfo: UserInfo = {
          userId: result.userId,
          userName: result.userName,
          email: result.email,
        }
        // 持久化到 localStorage
        localStorage.setItem(TOKEN_KEY, result.token)
        localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken)
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))

        set(
          { userInfo, token: result.token, refreshToken: result.refreshToken },
          false,
          'setLoginData',
        )
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(USER_INFO_KEY)
        set({ userInfo: null, token: null, refreshToken: null }, false, 'logout')
      },
    }),
    { name: 'AppStore' },
  ),
)

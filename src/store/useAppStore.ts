import type { ComponentType } from 'react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { LoginResult } from '@/services/auth'
import type { MenuTreeDto } from '@/services/menu'

// ─── localStorage key ────────────────────────────────────────────────────────
const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_INFO_KEY = 'user_info'
const REMEMBER_ME_KEY = 'remember_me'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ThemeMode = 'system' | 'light' | 'dark' | 'compact'

export type UserInfo = Pick<LoginResult, 'userId' | 'userName' | 'email'> & {
  /** 头像 URL，由后端扩展字段或个人设置填充 */
  avatar?: string
}

interface AppState {
  /** 全局 loading 状态 */
  loading: boolean
  /** 是否开启自动登录（记住登录状态） */
  rememberMe: boolean
  /** 登录用户信息 */
  userInfo: UserInfo | null
  /** 访问 token */
  token: string | null
  /** 刷新 token */
  refreshToken: string | null

  /** 当前用户的菜单树（根据平台过滤后） */
  menus: MenuTreeDto[]
  /** 懒加载的 @ant-design/icons 模块，用于动态菜单图标 */
  iconsModule: Record<string, ComponentType> | null

  /** 当前用户在该平台下拥有的全部菜单 Code（含目录/菜单/操作） */
  accessMenuCodes: string[]
  /** 仅 Operation 类型节点的菜单 Code（推荐用于按钮级权限） */
  accessOperationCodes: string[]
  /** 是否已经尝试加载过一次权限（即使失败） */
  accessInitialized: boolean

  /** 主题模式：system / light / dark / compact */
  themeMode: ThemeMode


  setLoading: (loading: boolean) => void
  /** 设置是否自动登录 */
  setRememberMe: (remember: boolean) => void
  /** 登录成功后统一写入用户信息和双 token */
  setLoginData: (result: LoginResult) => void
  /** 设置当前用户菜单树 */
  setMenus: (menus: MenuTreeDto[]) => void
  /** 设置懒加载的 icons 模块（由 MainLayout 等触发 import 后写入） */
  setIconsModule: (m: Record<string, ComponentType> | null) => void
  /** 设置当前用户权限（由 /Token/permission 计算后写入） */
  setAccessPermissions: (payload: { menuCodes: string[]; operationCodes: string[] }) => void
  /** 设置主题模式 */
  setThemeMode: (mode: ThemeMode) => void
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

const initialRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === '1'
const THEME_MODE_KEY = 'app_theme_mode'
const initialThemeMode = (localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null) ?? 'system'

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      loading: false,
      rememberMe: initialRememberMe,
      userInfo: initialRememberMe ? restoreUserInfo() : null,
      token: initialRememberMe ? localStorage.getItem(TOKEN_KEY) : null,
      refreshToken: initialRememberMe ? localStorage.getItem(REFRESH_TOKEN_KEY) : null,
      menus: [],
      iconsModule: null,
      accessMenuCodes: [],
      accessOperationCodes: [],
      accessInitialized: false,
      themeMode: initialThemeMode,

      setLoading: (loading) => set({ loading }, false, 'setLoading'),

      setRememberMe: (remember) => {
        set({ rememberMe: remember }, false, 'setRememberMe')
        if (remember) {
          localStorage.setItem(REMEMBER_ME_KEY, '1')
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY)
          // 关闭自动登录时，同时清理持久化的凭据
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          localStorage.removeItem(USER_INFO_KEY)
        }
      },

      setLoginData: (result) => {
        const userInfo: UserInfo = {
          userId: result.userId,
          userName: result.userName,
          email: result.email,
        }
        const remember = get().rememberMe

        if (remember) {
          // 仅在开启自动登录时持久化到 localStorage
          localStorage.setItem(REMEMBER_ME_KEY, '1')
          localStorage.setItem(TOKEN_KEY, result.token)
          localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken)
          localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
        } else {
          // 会话登录：确保本地持久化的历史凭据被清理
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          localStorage.removeItem(USER_INFO_KEY)
        }

        set(
          { userInfo, token: result.token, refreshToken: result.refreshToken },
          false,
          'setLoginData',
        )
      },

      setMenus: (menus) => set({ menus }, false, 'setMenus'),

      setIconsModule: (iconsModule) => set({ iconsModule }, false, 'setIconsModule'),

      setAccessPermissions: ({ menuCodes, operationCodes }) =>
        set(
          {
            accessMenuCodes: menuCodes,
            accessOperationCodes: operationCodes,
            accessInitialized: true,
          },
          false,
          'setAccessPermissions',
        ),

      setThemeMode: (mode) => {
        localStorage.setItem(THEME_MODE_KEY, mode)
        set({ themeMode: mode }, false, 'setThemeMode')
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
        localStorage.removeItem(USER_INFO_KEY)
        localStorage.removeItem(REMEMBER_ME_KEY)
        set(
          {
            userInfo: null,
            token: null,
            refreshToken: null,
            rememberMe: false,
            menus: [],
            iconsModule: null,
            accessMenuCodes: [],
            accessOperationCodes: [],
            accessInitialized: false,
          },
          false,
          'logout',
        )
      },
    }),
    { name: 'AppStore' },
  ),
)

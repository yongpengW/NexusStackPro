import { http } from '@/utils/request'

/** 平台类型：管理端固定为 2 */
const PLATFORM_TYPE = 2

// ─── Request ────────────────────────────────────────────────────────────────

export interface PasswordLoginParams {
  userName: string
  password: string
}

// ─── Response ───────────────────────────────────────────────────────────────

export interface LoginResult {
  userId: number
  userName: string
  email: string
  token: string
  refreshToken: string
  expirationDate: string
}

// ─── API ────────────────────────────────────────────────────────────────────

/**
 * 账号密码登录
 * POST /Token/password
 */
export function loginByPassword(params: PasswordLoginParams) {
  return http.post<LoginResult>('/Token/password', {
    ...params,
    platformType: PLATFORM_TYPE,
  })
}

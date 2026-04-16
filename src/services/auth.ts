import { http } from '@/utils/request'

/** 平台类型：管理端固定为 2 */
const PLATFORM_TYPE = 2

// ─── Request ────────────────────────────────────────────────────────────────

export interface PasswordLoginParams {
  userName: string
  password: string
}

export interface RefreshTokenParams {
  /** 与登录结果一致，雪花 ID 时后端 JsonLong 为字符串 */
  userId: string
  refreshToken: string
}

// ─── Response ───────────────────────────────────────────────────────────────

export interface LoginResult {
  userId: string
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

/**
 * 退出登录 To Do
 * POST /Token/signout
 */
export function signout() {
  return http.post<boolean>('/Token/signout', {})
}

/**
 * 刷新 Token
 * POST /Token/Refresh
 */
export function refreshTokenApi(params: RefreshTokenParams) {
  return http.post<LoginResult>('/Token/Refresh', params)
}

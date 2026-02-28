/**
 * 基础 HTTP 请求工具
 *
 * 后端统一响应格式 RequestResultModel<T>：
 *   { success, code, message, data, timestamp }
 *
 * 全局规则：
 *   code 200  → 成功，返回 data
 *   code 401  → 清除登录态，跳转 /login
 *   code 403  → 全局 notification 提示，抛出 ApiError(403)
 *   code 500  → 全局 notification 提示，抛出 ApiError(500)
 *   其他非200 → 抛出 ApiError(code, message)，由调用方决定如何处理
 */

import { globalMessage, globalNotification } from '@/utils/globalApp'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// ─── 后端统一响应结构 ──────────────────────────────────────────────────────────

export interface RequestResultModel<T = unknown> {
  success: boolean
  code: number
  message: string
  data: T
  timestamp: number
}

export interface RequestPagedResultModel<T = unknown> extends RequestResultModel<T[]> {
  total: number
  page: number
  totalPage: number
  limit: number
}

// ─── 错误类 ───────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── 全局错误处理 ─────────────────────────────────────────────────────────────

function handleGlobalError(code: number, message: string): void {
  switch (code) {
    case 401:
      // 清除本地登录态，跳转登录页（避免循环跳转：已在登录页则不再跳）
      if (!window.location.pathname.startsWith('/user/login')) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        globalMessage.warning('登录已过期，请重新登录')
        // 延迟跳转，让 message 有时间显示
        setTimeout(() => window.location.replace('/user/login'), 800)
      }
      break

    case 403:
      globalNotification.error({
        message: '无访问权限',
        description: message || '您没有权限执行此操作，请联系管理员',
        duration: 4,
      })
      break

    case 500:
      globalNotification.error({
        message: '服务器错误',
        description: message || '服务器内部错误，请稍后重试',
        duration: 4,
      })
      break

    default:
      // 其他业务错误不做全局处理，由调用方自行处理
      break
  }
}

// ─── 请求头 ───────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── 核心请求函数 ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
    })
  } catch {
    // 网络不通、DNS 失败等
    globalNotification.error({
      message: '网络连接失败',
      description: '无法连接到服务器，请检查网络连接',
      duration: 4,
    })
    throw new ApiError(0, '网络连接失败')
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T
  }

  // 解析响应体
  let body: RequestResultModel<T>
  try {
    body = await response.json()
  } catch {
    throw new ApiError(response.status, `无法解析响应内容 (HTTP ${response.status})`)
  }

  // HTTP 层非 200（如 nginx/网关层返回的错误，绕过了业务层）
  if (!response.ok) {
    const code = body?.code ?? response.status
    const msg = body?.message ?? `HTTP ${response.status}`
    handleGlobalError(code, msg)
    throw new ApiError(code, msg)
  }

  // 业务层判断：code !== 200 视为失败
  if (!body.success || body.code !== 200) {
    handleGlobalError(body.code, body.message)
    throw new ApiError(body.code, body.message)
  }

  // 成功：直接返回 data 字段，调用方无需感知包装层
  return body.data
}

// ─── 对外 API ─────────────────────────────────────────────────────────────────

export const http = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: 'GET', ...options }),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...options }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...options }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: 'DELETE', ...options }),
}


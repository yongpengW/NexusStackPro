/**
 * 基础 HTTP 请求工具
 *
 * 后端统一响应格式 RequestResultModel<T>：
 *   { success, code, message, data, timestamp }
 *
 * 全局规则：
 *   code 200  → 成功，返回 data
 *   code 401  → 先尝试用 refreshToken 换新 token 并重试原请求，刷新失败才登出
 *   code 403  → 全局 notification 提示，抛出 ApiError(403)
 *   code 500  → 全局 notification 提示，抛出 ApiError(500)
 *   其他非200 → 抛出 ApiError(code, message)，由调用方决定如何处理
 */

import { globalMessage, globalNotification } from '@/utils/globalApp'
import { useAppStore } from '@/store/useAppStore'
import type { RefreshTokenParams } from '@/services/auth'

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

// ─── Token 刷新队列（处理并发 401） ──────────────────────────────────────────

/** 是否正在刷新中，防止并发触发多次刷新 */
let isRefreshing = false

/** 刷新期间挂起的请求队列，刷新完成后统一重放 */
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }
let pendingQueue: QueueItem[] = []

/** 刷新成功：用新 token 放行所有等待的请求 */
function flushQueue(token: string) {
  pendingQueue.forEach((item) => item.resolve(token))
  pendingQueue = []
}

/** 刷新失败：拒绝所有等待的请求 */
function rejectQueue(err: unknown) {
  pendingQueue.forEach((item) => item.reject(err))
  pendingQueue = []
}

/** 执行登出并跳转登录页 */
function doLogout() {
  if (!window.location.pathname.startsWith('/user/login')) {
    useAppStore.getState().logout()
    globalMessage.warning('登录已过期，请重新登录')
    setTimeout(() => window.location.replace('/user/login'), 800)
  }
}

/**
 * 尝试用 refreshToken 换取新 token。
 * 并发 401 时，只有第一个请求真正发起刷新，其余挂起等待结果。
 */
async function tryRefreshToken(): Promise<string> {
  // 已有刷新在进行中 → 挂起等待
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      pendingQueue.push({ resolve, reject })
    })
  }

  isRefreshing = true

  const { userInfo, refreshToken } = useAppStore.getState()

  // 无法刷新（缺少必要信息）→ 拒绝队列中等待的请求并登出
  if (!userInfo?.userId || !refreshToken) {
    isRefreshing = false
    const err = new ApiError(401, '登录已过期')
    rejectQueue(err)
    doLogout()
    throw err
  }

  try {
    const params: RefreshTokenParams = { userId: userInfo.userId, refreshToken }
    // 直接调用 fetch 绕过 request()，避免循环刷新
    const res = await fetch(`${BASE_URL}/Token/Refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const body = await res.json()

    if (!res.ok || !body.success || body.code !== 200) {
      throw new Error(body?.message ?? '刷新失败')
    }

    const newToken: string = body.data.token
    // 更新 store 与 localStorage
    useAppStore.getState().setLoginData(body.data)
    flushQueue(newToken)
    return newToken
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(401, '登录已过期')
    rejectQueue(apiErr)
    doLogout()
    throw apiErr
  } finally {
    isRefreshing = false
  }
}

// ─── 全局错误处理 ─────────────────────────────────────────────────────────────

function handleGlobalError(code: number, message: string): void {
  switch (code) {
    case 403:
      globalNotification.error({
        message: '无访问权限',
        description: message || '您没有权限执行此操作，请联系管理员',
        duration: 4,
      })
      break

    case 500:
      globalNotification.error({
        message: '错误',
        description: message || '服务器内部错误，请稍后重试',
        duration: 4,
      })
      break

    default:
      // 其他业务错误不做全局处理，由调用方自行处理
      break
  }
}

// ─── 解析响应体 ─────────────────────────────────────────────────────────────

/**
 * 从 Response 解析 JSON 体。后端可能返回 401 且 body 为空，此时解析会抛错，本函数对 401 返回 null 便于上层统一走 401 流程。
 */
async function parseResponseBody<T>(response: Response): Promise<T | null> {
  try {
    const text = await response.text()
    return text ? (JSON.parse(text) as T) : null
  } catch {
    if (response.status === 401) {
      return null
    }
    throw new ApiError(response.status, `无法解析响应内容 (HTTP ${response.status})`)
  }
}

// ─── 请求头 ───────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const state = useAppStore.getState()
  const token = state.token ?? localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── 核心请求函数 ─────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`

  const buildHeaders = (token?: string): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
    ...(options.headers as Record<string, string>),
  })

  let response: Response
  try {
    response = await fetch(url, { ...options, headers: buildHeaders() })
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

  let body = await parseResponseBody<RequestResultModel<T>>(response)

  // ─── 401：先尝试刷新 token，成功后重试原请求 ───────────────────────────────
  const is401 =
    response.status === 401 || (body && !body.success && body.code === 401)

  if (is401) {
    // 登录接口返回 401 = 账号密码错误，直接抛出，由调用方显示提示，不触发刷新
    if (path === '/Token/password') {
      throw new ApiError(401, body?.message ?? '账号或密码错误')
    }
    // 刷新/登出接口自身返回 401，直接登出，避免死循环
    if (path === '/Token/Refresh' || path === '/Token/signout') {
      doLogout()
      throw new ApiError(401, '登录已过期')
    }
    try {
      const newToken = await tryRefreshToken()
      // 用新 token 重放原请求
      const retryResponse = await fetch(url, { ...options, headers: buildHeaders(newToken) })
      if (retryResponse.status === 204) return undefined as T
      const retryBody = await parseResponseBody<RequestResultModel<T>>(retryResponse)
      if (retryBody === null && retryResponse.status === 401) {
        doLogout()
        throw new ApiError(401, '登录已过期')
      }
      // 重试后仍 401 → 强制登出（新 token 立刻失效，属于异常情况）
      if (retryResponse.status === 401 || (retryBody && retryBody.code === 401)) {
        doLogout()
        throw new ApiError(401, '登录已过期')
      }
      if (!retryBody || !retryBody.success || retryBody.code !== 200) {
        const code = retryBody?.code ?? retryResponse.status
        const msg = retryBody?.message ?? `HTTP ${retryResponse.status}`
        handleGlobalError(code, msg)
        throw new ApiError(code, msg)
      }
      return retryBody.data
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(0, '网络连接失败')
    }
  }

  // 401 且 body 为空时上面已处理，若仍到此处则防御性登出
  if (body === null) {
    throw new ApiError(401, '登录已过期')
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

/**
 * 分页接口专用：返回 { items, total } 而非仅 data 字段。
 * 后端分页响应格式：{ success, code, data: T[], total, page, totalPage, limit, timestamp }
 */
export async function fetchPagedData<T>(
  path: string,
): Promise<{ items: T[]; total: number }> {
  const url = `${BASE_URL}${path}`

  const makeRequest = async (token?: string): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    return fetch(url, { method: 'GET', headers })
  }

  let response: Response
  try {
    response = await makeRequest()
  } catch {
    globalNotification.error({ message: '网络连接失败', description: '无法连接到服务器', duration: 4 })
    throw new ApiError(0, '网络连接失败')
  }

  let body = await parseResponseBody<RequestPagedResultModel<T>>(response)

  // 401 → 尝试刷新 token
  const is401 = response.status === 401 || (body && !body.success && body.code === 401)
  if (is401) {
    try {
      const newToken = await tryRefreshToken()
      const retryResponse = await makeRequest(newToken)
      body = await parseResponseBody<RequestPagedResultModel<T>>(retryResponse)
      if (body === null && retryResponse.status === 401) {
        doLogout()
        throw new ApiError(401, '登录已过期')
      }
      // 重试后仍 401 → 强制登出并跳转登录页（与 request() 行为一致）
      if (retryResponse.status === 401 || (body && !body.success && body.code === 401)) {
        doLogout()
        throw new ApiError(401, '登录已过期')
      }
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(0, '网络连接失败')
    }
  }

  if (body === null || !body.success || body.code !== 200) {
    const code = body?.code ?? response.status
    const msg = body?.message ?? `HTTP ${response.status}`
    handleGlobalError(code, msg)
    throw new ApiError(code, msg)
  }

  return { items: body.data, total: (body as RequestPagedResultModel<T>).total ?? 0 }
}

/**
 * 将对象拼接为 URL 查询字符串，自动过滤 undefined / null / '' 值
 *
 * @example
 *   buildUrl('/Region/list', { keyword: 'admin', level: 1 })
 *   // → '/Region/list?keyword=admin&level=1'
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  if (!params) return path
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `${path}?${qs}` : path
}


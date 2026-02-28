/**
 * 日期时间工具
 *
 * 规范：
 *  - 后端传来的时间字符串均为 UTC ISO 8601（带 Z 后缀）
 *  - 前端展示时统一转为用户本地时区
 *  - 向后端提交时间时统一转回 UTC ISO 字符串
 *
 * 依赖：dayjs（已在项目中安装）
 * dayjs 解析带 Z 的 ISO 字符串会自动识别 UTC，format() 输出为本地时区，无需手动转换。
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 注册插件（幂等，多次调用无副效果）
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// ─── 展示格式常量 ──────────────────────────────────────────────────────────────

export const DATE_FORMAT = 'YYYY-MM-DD'
export const TIME_FORMAT = 'HH:mm:ss'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const DATETIME_MINUTE_FORMAT = 'YYYY-MM-DD HH:mm'

// ─── 展示用：UTC → 本地时区 ───────────────────────────────────────────────────

/**
 * 格式化日期时间（UTC → 本地时区展示）
 * @param value  后端返回的 UTC 时间字符串 / 时间戳
 * @param format 显示格式，默认 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDateTime(
  value: string | number | null | undefined,
  format = DATETIME_FORMAT,
): string {
  if (!value) return '-'
  const d = dayjs(value) // 自动识别 UTC（带 Z）或本地时间
  return d.isValid() ? d.format(format) : '-'
}

/** 仅展示日期部分 */
export function formatDate(value: string | number | null | undefined): string {
  return formatDateTime(value, DATE_FORMAT)
}

/** 仅展示时间部分 */
export function formatTime(value: string | number | null | undefined): string {
  return formatDateTime(value, TIME_FORMAT)
}

/**
 * 相对时间（如：3 小时前、2 天前）
 * 适合消息通知、操作日志等场景
 */
export function fromNow(value: string | number | null | undefined): string {
  if (!value) return '-'
  const d = dayjs(value)
  return d.isValid() ? d.fromNow() : '-'
}

// ─── 提交用：本地时间 → UTC ISO 字符串 ───────────────────────────────────────

/**
 * 将 dayjs 对象或本地时间字符串转为 UTC ISO 8601 字符串，用于提交给后端
 * 示例输出："2026-02-28T06:24:13.000Z"
 */
export function toUtcISOString(value: dayjs.Dayjs | string | null | undefined): string | null {
  if (!value) return null
  const d = typeof value === 'string' ? dayjs(value) : value
  return d.isValid() ? d.utc().toISOString() : null
}

/**
 * DatePicker 范围选择器常用：将 [start, end] 转为 UTC ISO 字符串对
 */
export function toUtcRangePair(
  range: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null | undefined,
): [string | null, string | null] {
  if (!range) return [null, null]
  return [toUtcISOString(range[0]), toUtcISOString(range[1])]
}

// ─── 通用格式化 ────────────────────────────────────────────────────────────────

/**
 * 格式化为货币展示（保留两位小数）
 * @example formatCurrency(1234.5) → '1234.50'
 * @example formatCurrency(null)   → '0.00'
 */
export function formatCurrency(value: number | string | null | undefined): string {
  try {
    const num = Number(value)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  } catch {
    return '0.00'
  }
}

/**
 * 雪花 ID（Int64）与 JavaScript Number
 *
 * JS 的 number 为 IEEE754 双精度，安全整数范围为 ±(2^53−1)。雪花 ID 常为 64 位整型，
 * 若以 JSON **数字**传输，`JSON.parse` 阶段即可能失真；若以字符串传输则无此问题。
 *
 * 推荐约定：
 *  - 后端对 long 使用 JsonLong 等转为 JSON 字符串；
 *  - 前端类型与表单用 `string`，请求体、URL 路径拼接均使用本工具归一化后的字符串；
 *  - 避免对 ID 使用 `Number()` / `parseInt`，除非已确认值在安全整数范围内且非雪花场景。
 */

/** 与 `Number.MAX_SAFE_INTEGER` 一致，便于在注释或调试中与雪花对比 */
export const MAX_JS_SAFE_INTEGER = Number.MAX_SAFE_INTEGER

/** 语义化类型别名：调用方 DTO 可写 `id: SnowflakeId` */
export type SnowflakeId = string

/** 判断 number 是否为整数且已超出 JS 安全整数（常见于错误地把雪花当成 number 解析后） */
export function isUnsafeSnowflakeNumber(n: number): boolean {
  return Number.isInteger(n) && !Number.isSafeInteger(n)
}

/**
 * 根节点占位：无父级、或业务约定为 0 时，在请求里可省略字段，表单里常用 '0'。
 */
export function isRootSnowflakeValue(value: string | number | null | undefined): boolean {
  if (value == null) return true
  if (typeof value === 'number') return value === 0
  const s = String(value).trim()
  return s === '' || s === '0'
}

/**
 * 将任意来源（接口、表单、Select）规范为雪花字符串。
 * 无法识别时返回 `undefined`。
 */
export function snowflakeStringFromUnknown(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) return undefined
    return String(value)
  }
  if (typeof value === 'string') {
    const s = value.trim()
    return s === '' ? undefined : s
  }
  return undefined
}

/**
 * 表单/下拉中「父级 ID」等可选字段：根节点（0 / '0' / 空）→ `undefined`，否则返回字符串。
 * 提交 DTO 时用于替代 `Number(x)`，避免雪花被截断。
 */
export function toOptionalSnowflakeString(
  value: string | number | null | undefined,
): string | undefined {
  if (isRootSnowflakeValue(value)) return undefined
  return snowflakeStringFromUnknown(value)
}

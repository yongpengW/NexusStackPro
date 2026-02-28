/**
 * Excel 工具库
 *
 * 提供 Excel 文件的读取、导出、数据格式化及导入校验能力。
 *
 * 依赖：exceljs、dayjs
 * 用法示例见各函数注释。
 */

import ExcelJS from 'exceljs'
import { t } from 'i18next'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { globalMessage } from '@/utils/globalApp'
import React from 'react'

// excel.tsx 内部直接注册 utc 插件，不依赖 dateUtils.ts 的副作用执行顺序
dayjs.extend(utc)

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

/** 数据类型枚举 */
export const DataType = {
  number: 'number',
  date: 'date',
  string: 'string',
} as const
export type DataTypeValue = (typeof DataType)[keyof typeof DataType]

/** 模板字段定义 */
export interface TemplateField {
  /** 列标题（Excel 表头显示文本） */
  title: string
  /** 数据类型，默认 string */
  type?: DataTypeValue
  /** 是否必填（Excel 表头会加 * 前缀） */
  required?: boolean
  /** 数字类型是否允许负数 */
  allowNegative?: boolean
  /** 表格列自定义渲染函数 */
  format?: (value: unknown) => React.ReactNode
  /** 导出时的默认值 */
  value?: unknown
  /**
   * 仅在 type === 'date' 时生效。
   * 导入时将 Excel 中的本地日期字符串转为 UTC ISO 8601 字符串（带 Z 后缀），
   * 便于直接提交给后端存储到 UTC 数据库字段。
   * @example '2026-03-01' → '2026-02-28T16:00:00.000Z'（东八区）
   */
  outputUtc?: boolean
}

export type ExcelTemplate = Record<string, TemplateField>

/** 下载用的 Sheet 数据结构 */
export interface SheetTemplate {
  sheetName: string
  sheetData: unknown[][]
  fileName: string
}

/** 列映射项，用于 downloadDataSource 的 map 参数 */
export interface ColumnMapItem {
  key: string
  title: string
  /**
   * 导出时将此列的 UTC 时间字符串自动转为用户本地时区格式写入 Excel。
   * 适用于后端返回的 UTC 日期字段（如 expirationDate、createdAt 等）。
   * @example utcToLocal: true → '2026-03-01T00:00:00.000Z' 写为 '2026-03-01 08:00:00'
   */
  utcToLocal?: boolean
  /**
   * 自定义导出格式化函数，返回值直接写入单元格。
   * 优先级高于 utcToLocal。
   */
  format?: (value: unknown) => unknown
}

/** 导入后的行数据（含校验结果） */
export interface ImportedRow {
  [key: string]: unknown
  /** 校验错误汇总，分号分隔；为空字符串则表示校验通过 */
  Result: string
  /** 原始行数据 */
  _source?: Record<string, unknown>
}

// ─── 内部工具 ──────────────────────────────────────────────────────────────────

const ROW_INDEX_KEY = '_index'

/** 触发浏览器下载二进制数据 */
function triggerDownload(fileName: string, data: ArrayBuffer, mimeType: string): void {
  const blob = new Blob([data], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // 延迟释放，避免部分浏览器在 click 事件异步传播完成前 URL 已被销毁
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ─── 文件名工具 ────────────────────────────────────────────────────────────────

/**
 * 在文件名中插入当前时间戳
 * @example addFileTime('report.xlsx') → 'report_2026-03-01-14-30-00.xlsx'
 */
export function addFileTime(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  const name = dotIndex >= 0 ? fileName.substring(0, dotIndex) : fileName
  const ext = dotIndex >= 0 ? fileName.substring(dotIndex) : ''
  // 使用连字符而非冒号：Windows 文件名禁止包含冒号
  return `${name}_${dayjs().format('YYYY-MM-DD-HH-mm-ss')}${ext}`
}

// ─── 读取 Excel ────────────────────────────────────────────────────────────────

export interface ReadFileInfo {
  file: {
    name: string
    originFileObj: File
  }
}

/**
 * 读取 antd Upload 上传的 Excel 文件，返回第一个 Sheet 的数据（以表头为 key 的对象数组）
 *
 * 仅支持 .xlsx 格式（ExcelJS 不支持旧版 .xls）。
 * ExcelJS 会原生将日期单元格解析为 Date 对象，无需手动识别日期序列号。
 *
 * @example
 * const data = await readFile(fileInfo)
 * // [{ 姓名: '张三', 年龄: 25 }, ...]
 */
export function readFile(fileInfo: ReadFileInfo): Promise<Record<string, unknown>[]> {
  return new Promise((resolve) => {
    const name = fileInfo.file.name
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase()

    if (ext !== '.xlsx') {
      globalMessage.error('不支持的文件类型，请上传 .xlsx 文件')
      resolve([])
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const buffer = e.target!.result as ArrayBuffer
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          resolve([])
          return
        }

        // 收集所有行（row.values 是 1-indexed，slice(1) 去掉首位 undefined）
        const allRows: unknown[][] = []
        worksheet.eachRow((row) => {
          allRows.push((row.values as unknown[]).slice(1))
        })

        if (allRows.length === 0) {
          resolve([])
          return
        }

        const headers = allRows[0] as (string | null)[]
        const result: Record<string, unknown>[] = []

        for (let i = 1; i < allRows.length; i++) {
          const rawRow = allRows[i]
          const row: Record<string, unknown> = {}

          for (let j = 0; j < headers.length; j++) {
            const header = headers[j]
            if (header == null) continue

            const cellValue = rawRow[j]

            if (cellValue === null || cellValue === undefined) {
              row[header] = ''
            } else if (cellValue instanceof Date) {
              // ExcelJS 原生将日期单元格解析为 Date 对象，用 UTC 方法避免跨时区偏移
              row[header] = `${cellValue.getUTCFullYear()}/${cellValue.getUTCMonth() + 1}/${cellValue.getUTCDate()}`
            } else if (typeof cellValue === 'object' && 'richText' in (cellValue as object)) {
              // 富文本单元格 → 拼接纯文本
              row[header] = (cellValue as { richText: { text: string }[] }).richText
                .map((rt) => rt.text)
                .join('')
            } else if (typeof cellValue === 'object' && 'result' in (cellValue as object)) {
              // 公式单元格 → 取计算结果
              row[header] = String((cellValue as { result: unknown }).result ?? '')
            } else if (typeof cellValue === 'number') {
              row[header] = cellValue // 保持数字精度
            } else {
              row[header] = String(cellValue)
            }
          }

          // 跳过全空行（Excel 尾部常有多余空行，避免产生无意义的校验报错）
          const hasValue = Object.values(row).some((v) => v !== '' && v !== null && v !== undefined)
          if (hasValue) result.push(row)
        }

        resolve(result)
      } catch (err) {
        console.error('[readFile] 解析 Excel 失败:', err)
        globalMessage.error('Excel 文件解析失败，请检查文件格式')
        resolve([])
      }
    }

    reader.onerror = () => {
      globalMessage.error('文件读取失败')
      resolve([])
    }

    reader.readAsArrayBuffer(fileInfo.file.originFileObj)
  })
}

// ─── 下载 Excel ────────────────────────────────────────────────────────────────

/**
 * 根据 SheetTemplate 生成并下载 Excel 文件（ExcelJS，支持原生样式）
 *
 * ExcelJS 的 `writeBuffer()` 返回 Promise，因此本函数为异步。
 */
export async function downloadFile(template: SheetTemplate): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(template.sheetName)

    // 按行写入数据
    template.sheetData.forEach((row) => {
      worksheet.addRow(row as ExcelJS.CellValue[])
    })

    // 为所有单元格应用默认字体（与迁移前行为保持一致）
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.font) {
          cell.font = { name: 'Calibri', size: 11 }
        }
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    triggerDownload(
      template.fileName,
      buffer as ArrayBuffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
  } catch (err) {
    console.error('[downloadFile] 导出失败:', err)
    globalMessage.error('Excel 导出失败')
  }
}

/**
 * 将数据数组直接导出为 Excel 并下载
 *
 * @param data       数据源（对象数组 或 二维数组）
 * @param fileName   文件名（不含扩展名），默认 'Download'
 * @param sheetName  Sheet 名称，默认 'Sheet1'
 * @param withIndex  是否添加序号列
 * @param map        列映射（指定导出哪些列及列标题顺序）
 */
export async function downloadDataSource(
  data: Record<string, unknown>[] | unknown[][],
  fileName = 'Download',
  sheetName = 'Sheet1',
  withIndex = false,
  map?: ColumnMapItem[],
): Promise<void> {
  const template: SheetTemplate = {
    sheetData: formatSheetData(data, withIndex, map),
    sheetName,
    fileName: addFileTime(`${fileName}.xlsx`),
  }
  await downloadFile(template)
}

// ─── Sheet 数据格式化 ──────────────────────────────────────────────────────────

/**
 * 将数据源转换为 Excel 二维数组格式
 */
export function formatSheetData(
  dataSource: Record<string, unknown>[] | unknown[][] | Record<string, TemplateField>,
  withIndex = false,
  map?: ColumnMapItem[],
): unknown[][] {
  if (map) return formatSheetDataWithMap(dataSource as Record<string, unknown>[], withIndex, map)

  try {
    if (!Array.isArray(dataSource)) {
      // 对象格式：{ fieldKey: { title, value } } → 两行（表头 + 数据）
      const keys = Object.keys(dataSource as Record<string, TemplateField>)
      const fields = dataSource as Record<string, TemplateField>
      const headers = keys.map((k) => (fields[k].required ? '*' : '') + (fields[k].title ?? k))
      const values = keys.map((k) => fields[k].value ?? '')
      return [headers, values]
    }

    if (dataSource.length === 0) return []

    // 二维数组：直接返回，每个子数组即一行
    if (Array.isArray(dataSource[0])) {
      return dataSource as unknown[][]
    }

    // 字符串数组（单行数据直接返回）
    if (typeof dataSource[0] === 'string') {
      return [dataSource as unknown as string[]]
    }

    const rows = dataSource as Record<string, unknown>[]

    // 收集所有唯一列名
    const allKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    const headers: string[] = withIndex ? ['#', ...allKeys] : allKeys

    const result: unknown[][] = [headers]
    rows.forEach((row, index) => {
      const data: unknown[] = withIndex ? [index + 1] : []
      allKeys.forEach((key) => data.push(row[key] ?? ''))
      result.push(data)
    })

    return result
  } catch (err) {
    console.error('[formatSheetData] 格式化失败:', err)
    globalMessage.error('数据格式化失败')
    return []
  }
}

/** 按 map 指定的列顺序格式化数据，支持 UTC → 本地时区转换 */
function formatSheetDataWithMap(
  dataSource: Record<string, unknown>[],
  withIndex: boolean,
  map: ColumnMapItem[],
): unknown[][] {
  try {
    const headers: unknown[] = withIndex ? ['#', ...map.map((m) => m.title)] : map.map((m) => m.title)
    const result: unknown[][] = [headers]

    dataSource.forEach((row, index) => {
      const data: unknown[] = withIndex ? [index + 1] : []
      map.forEach((m) => {
        const rawVal = row[m.key] ?? ''
        if (m.format) {
          data.push(m.format(rawVal))
        } else if (m.utcToLocal && rawVal) {
          // UTC 字符串 → 本地时区格式，写入 Excel 的是用户可读的本地时间
          const d = dayjs(rawVal as string)
          data.push(d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : rawVal)
        } else {
          data.push(rawVal)
        }
      })
      result.push(data)
    })

    return result
  } catch (err) {
    console.error('[formatSheetDataWithMap] 格式化失败:', err)
    globalMessage.error('数据格式化失败')
    return []
  }
}

// ─── 导入数据校验 ──────────────────────────────────────────────────────────────

/**
 * 将 readFile 返回的原始数据按模板规则解析并校验
 *
 * @param dataSource  readFile 返回的原始数据
 * @param template    字段模板定义
 * @returns 带 Result（校验错误）和带下划线前缀列（用于 Table 展示）的行数组
 */
export function getImportData(
  dataSource: Record<string, unknown>[],
  template: ExcelTemplate,
): ImportedRow[] {
  return dataSource.map((row, index) => {
    const item = extractItem(template, row, index)
    return validateRow(item, template)
  })
}

/** 从原始行中按模板提取并转换字段值 */
function extractItem(
  template: ExcelTemplate,
  row: Record<string, unknown>,
  index: number,
): ImportedRow {
  const item: ImportedRow = { Result: '' }

  for (const key of Object.keys(template)) {
    const field = template[key]
    const headerKey = (field.required ? '*' : '') + (field.title ?? key)
    const rawValue = row[headerKey]

    if (rawValue === null || rawValue === undefined || rawValue === '') {
      // 空值统一为 ''，不提前填 0，避免必填数字字段留空时绕过必填校验
      item[key] = ''
      continue
    }

    if (field.type === DataType.date) {
      const dateStr = String(rawValue)
      if (field.outputUtc) {
        // Excel 中读到的是用户本地时间，转为 UTC ISO 字符串提交后端
        const d = dayjs(dateStr)
        item[key] = d.isValid() ? d.utc().toISOString() : dateStr
      } else {
        item[key] = dateStr
      }
    } else if (field.type === DataType.number) {
      if (typeof rawValue === 'number') {
        item[key] = rawValue
      } else {
        const num = parseFloat(String(rawValue))
        item[key] = isNaN(num) ? String(rawValue) : num
      }
    } else {
      item[key] = String(rawValue)
    }
  }

  item[ROW_INDEX_KEY] = index + 1
  item._source = row
  return item
}

/** 校验行数据，填写带前缀的展示列，收集错误信息 */
function validateRow(item: ImportedRow, template: ExcelTemplate): ImportedRow {
  const errors: string[] = []

  for (const key of Object.keys(template)) {
    const field = template[key]
    const displayKey = `_${key}`
    item[displayKey] = item[key]

    // 必填校验
    if (field.required && (item[key] == null || String(item[key]).trim() === '')) {
      errors.push(`${field.title}${t('app.operation.upload.download.template.required')}`)
    }

    // 数字类型校验
    if (field.type === DataType.number) {
      const num = Number(item[key])
      if (isNaN(num)) {
        item[displayKey] = <span className="text-orange-400">{String(item[key])}</span>
        errors.push(`${field.title}${t('app.operation.upload.download.template.is.number')}`)
      } else if (!field.allowNegative && num < 0) {
        item[displayKey] = <span className="text-orange-400">{String(item[key])}</span>
        errors.push(`${field.title}${t('app.operation.upload.download.template.is.negative')}`)
      }
    }

    // 日期类型校验：使用 dayjs 保持跨浏览器一致性（Date.parse 在 Firefox 对部分格式返回 NaN）
    // 空值已由必填校验负责，此处只校验非空但格式错误的情况
    if (field.type === DataType.date && item[key] !== '' && !dayjs(String(item[key])).isValid()) {
      item[displayKey] = <span className="text-orange-400">{String(item[key])}</span>
      errors.push(`${field.title}${t('app.operation.upload.download.template.is.date')}`)
    }
  }

  item.Result = errors.join('; ')
  return item
}

// ─── antd Table 列定义生成 ─────────────────────────────────────────────────────

/**
 * 根据模板生成 antd Table 的 columns 配置（含序号列）
 *
 * 生成的列 dataIndex 均带 `_` 前缀（对应 getImportData 返回的展示字段）。
 */
export function getColumns(template: ExcelTemplate) {
  const columns = [
    {
      key: ROW_INDEX_KEY,
      dataIndex: ROW_INDEX_KEY,
      title: '#',
      width: 60,
    },
  ]

  for (const key of Object.keys(template)) {
    const field = template[key]
    const col: Record<string, unknown> = {
      key: `_${key}`,
      dataIndex: `_${key}`,
      title: field.title ?? key,
    }
    if (field.format) col.render = field.format
    columns.push(col as typeof columns[0])
  }

  return columns
}
// ─── antd Table columns 转 Excel map ──────────────────────────────────────────────

/**
 * 从 antd Table columns 提取 Excel 导出所需的 ColumnMapItem 数组
 *
 * 常配合 downloadDataSource(data, fileName, sheetName, false, map) 使用，
 * 避免手动维护一份 列映射。
 *
 * @example
 * const map = getColumnMapFromTable(columns)
 * downloadDataSource(data, '导出', 'Sheet1', false, map)
 */
export function getColumnMapFromTable(
  columns: { dataIndex?: string; key?: string; title?: unknown }[],
): ColumnMapItem[] {
  return columns
    .filter((col) => col.dataIndex || col.key)
    .map((col) => ({
      key: (col.dataIndex ?? col.key ?? '') as string,
      title: typeof col.title === 'string' ? col.title : String(col.title ?? ''),
    }))
    .filter((item) => item.key !== '')
}
// ─── 默认导出（向后兼容） ────────────────────────────────────────────────────────

const excel = {
  readFile,
  downloadFile,
  downloadDataSource,
  formatSheetData,
  addFileTime,
  getImportData,
  getColumns,
  getColumnMapFromTable,
  DataType,
  ROW_INDEX_KEY,
}

export default excel

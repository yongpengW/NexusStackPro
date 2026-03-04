import { http, buildUrl } from '@/utils/request'

// ─── 枚举 ────────────────────────────────────────────────────────────────────

export enum RegionLevel {
  Country    = 0, // 国家
  Province   = 1, // 省
  City       = 2, // 市/区
  Department = 3, // 公司/部门/机构
}

export const RegionLevelLabels: Record<RegionLevel, string> = {
  [RegionLevel.Country]:    '国家',
  [RegionLevel.Province]:   '省',
  [RegionLevel.City]:       '市/区',
  [RegionLevel.Department]: '部门',
}

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface RegionDto {
  id: number
  name: string
  shortName: string
  code: string
  parentId: number
  level: RegionLevel
  order: number
  idSequences: string
  isEnable: boolean
  remark: string
  createdAt: string
  updatedAt: string
}

export interface RegionTreeDto extends RegionDto {
  children: RegionTreeDto[]
}

export interface CreateRegionDto {
  name: string
  code: string
  shortName?: string
  level: RegionLevel
  parentId: number
  order: number
  isEnable: boolean
  remark?: string
}

export interface SelectOptionDto {
  label: string
  value: number
  children?: SelectOptionDto[]
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface RegionTreeQueryDto {
  parentId?: number
  includeChilds?: boolean
}

export interface RegionListQueryDto {
  keyword?: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const RegionApi = {
  /** GET /api/Region/tree — 完整树形数据（页面初始化） */
  getTree: (params?: RegionTreeQueryDto) =>
    http.get<RegionTreeDto[]>(buildUrl('/Region/tree', params as Record<string, string | number | boolean | undefined | null>)),

  /** GET /api/Region/list — 关键词搜索返回扁平列表 */
  getList: (params?: RegionListQueryDto) =>
    http.get<RegionDto[]>(buildUrl('/Region/list', params as Record<string, string | number | boolean | undefined | null>)),

  /** GET /api/Region/selector — 上级区域选择器 */
  getSelector: (level?: RegionLevel, isIncludeZero = true) =>
    http.get<SelectOptionDto[]>(
      buildUrl('/Region/selector', { level, isIncludeZero }),
    ),

  /** GET /api/Region/treeSelector — 树状选择器（含 children） */
  getTreeSelector: () =>
    http.get<SelectOptionDto[]>('/Region/treeSelector'),

  /** GET /api/Region/{id} — 单条详情（编辑回显用） */
  getById: (id: number) =>
    http.get<RegionDto>(`/Region/${id}`),

  /** POST /api/Region — 新增 */
  create: (data: CreateRegionDto) =>
    http.post<number>('/Region', data),

  /** PUT /api/Region/{id} — 编辑 */
  update: (id: number, data: CreateRegionDto) =>
    http.put<void>(`/Region/${id}`, data),

  /** DELETE /api/Region/{id} — 删除 */
  remove: (id: number) =>
    http.delete<void>(`/Region/${id}`),

  /** PUT /api/Region/Enable/{id} — 启用 */
  enable: (id: number) =>
    http.put<void>(`/Region/Enable/${id}`, {}),

  /** PUT /api/Region/Disable/{id} — 禁用 */
  disable: (id: number) =>
    http.put<void>(`/Region/Disable/${id}`, {}),
}

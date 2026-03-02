import { http, buildUrl, fetchPagedData } from '@/utils/request'

// ─── 枚举 ────────────────────────────────────────────────────────────────────

/** Flags 枚举，0 = 全部（查询用，不存库） */
export enum PlatformType {
  All     = 0,
  Admin   = 1,
  Pc      = 2,
  Mini    = 4,
  Android = 8,
}

export const PLATFORM_META: Record<number, { label: string; color: string }> = {
  [PlatformType.Admin]:   { label: '超管',   color: 'red' },
  [PlatformType.Pc]:      { label: 'PC端',   color: 'blue' },
  [PlatformType.Mini]:    { label: '小程序', color: 'green' },
  [PlatformType.Android]: { label: 'App',    color: 'orange' },
}

/** 平台列表（排除 All），用于 Checkbox/Radio */
export const PLATFORM_OPTIONS = [
  { value: PlatformType.Admin,   label: '超管',   color: 'red' },
  { value: PlatformType.Pc,      label: 'PC端',   color: 'blue' },
  { value: PlatformType.Mini,    label: '小程序', color: 'green' },
  { value: PlatformType.Android, label: 'App',    color: 'orange' },
]

/** Flags 位掩码 → 包含的平台值数组 */
export function parsePlatformFlags(flags: number): PlatformType[] {
  return [PlatformType.Admin, PlatformType.Pc, PlatformType.Mini, PlatformType.Android]
    .filter((p) => (flags & p) !== 0)
}

/** 平台值数组 → Flags 位掩码 */
export function composePlatformFlags(platforms: PlatformType[]): number {
  return platforms.reduce((acc, p) => acc | p, 0)
}

export enum MenuType {
  Subsystem = 1,
  Directory = 2,
  Menu      = 3,
  Operation = 4,
}

/** 数据范围：枚举值越小范围越宽，多角色合并时取最小值（最宽松） */
export enum DataRange {
  All                    = 0, // 全部数据
  CurrentAndSubLevels    = 1, // 本级及下级
  CurrentLevel           = 2, // 本级
  CurrentAndParentLevels = 3, // 本级及上级
  Self                   = 4, // 仅本人
}

export const DATA_RANGE_OPTIONS: { value: DataRange; label: string }[] = [
  { value: DataRange.All,                    label: '全部' },
  { value: DataRange.CurrentAndSubLevels,    label: '本级及下级' },
  { value: DataRange.CurrentLevel,           label: '本级' },
  { value: DataRange.CurrentAndParentLevels, label: '本级及上级' },
  { value: DataRange.Self,                   label: '仅本人' },
]

/** 单条菜单权限提交项 */
export interface MenuPermissionItem {
  menuId:    number
  dataRange: DataRange
}

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface RoleDto {
  id: number
  name: string
  code: string
  isSystem: boolean
  order: number
  remark: string
  isEnable: boolean
  platforms: number // PlatformType Flags 位掩码
}

export interface CreateRoleDto {
  name: string
  code: string
  platforms: number
  order?: number
  isEnable: boolean
  isSystem?: boolean
  remark?: string
}

export interface PermissionDto {
  id: number
  roleId: number
  menuId: number
  menuName: string
  menuParentId: number
  menuUrl: string
  menuType: MenuType
  menuOrder: number
  /**
   * 当前角色是否持有该权限（后端计算字段，Permission 记录存在即为 true）。
   * 禁止从 DTO 中移除，前端权限树回显依赖此值。
   */
  hasPermission: boolean
  /** 数据范围，仅 Menu / Operation 节点有实际意义；Directory / Subsystem 固定为 All */
  dataRange: DataRange
  children?: PermissionDto[]
  operations?: PermissionDto[]
}

export interface ChangeRolePermissionDto {
  roleId: number
  platformType?: number
  /** 每条菜单权限均需携带 dataRange；halfChecked 父节点统一使用 DataRange.All */
  menus: MenuPermissionItem[]
}

export interface SelectOptionDto {
  label: string
  value: number
  children?: SelectOptionDto[]
}

// ─── Query Params ─────────────────────────────────────────────────────────────

export interface RoleQueryParams {
  page?: number
  limit?: number
  keyword?: string
  isEnable?: boolean
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const RoleApi = {
  /** GET /api/Role/list/{platformType} — 分页列表 */
  getList: (platformType: number, params?: RoleQueryParams) =>
    fetchPagedData<RoleDto>(
      buildUrl(`/Role/list/${platformType}`, params as Record<string, string | number | boolean | undefined | null>),
    ),

  /** GET /api/Role/selector — 选择器数据 */
  getSelector: () =>
    http.get<SelectOptionDto[]>('/Role/selector'),

  /** GET /api/Role/{id} — 详情 */
  getById: (id: number) =>
    http.get<RoleDto>(`/Role/${id}`),

  /** POST /api/Role — 新增 */
  create: (data: CreateRoleDto) =>
    http.post<number>('/Role', data),

  /** PUT /api/Role/{id} — 编辑 */
  update: (id: number, data: CreateRoleDto) =>
    http.put<void>(`/Role/${id}`, data),

  /** DELETE /api/Role/{id} — 删除 */
  remove: (id: number) =>
    http.delete<void>(`/Role/${id}`),

  /** PUT /api/Role/enable/{id} — 启用 */
  enable: (id: number) =>
    http.put<void>(`/Role/enable/${id}`, {}),

  /** PUT /api/Role/disable/{id} — 禁用 */
  disable: (id: number) =>
    http.put<void>(`/Role/disable/${id}`, {}),

  /** GET /api/Role/permission — 获取全量菜单树及角色权限状态 */
  getPermission: (roleId: number, platformType: number) =>
    http.get<PermissionDto[]>(buildUrl('/Role/permission', { roleId, platformType })),

  /** POST /api/Role/permission/{roleId} — 保存角色权限 */
  savePermission: (roleId: number, data: ChangeRolePermissionDto) =>
    http.post<void>(`/Role/permission/${roleId}`, data),
}

import { http, buildUrl } from '@/utils/request'

// ─── 枚举（与后端一致） ────────────────────────────────────────────────────────

export enum MenuType {
  Subsystem = 1,
  Directory = 2,
  Menu      = 3,
  Operation = 4,
}

export const MenuTypeLabels: Record<MenuType, string> = {
  [MenuType.Subsystem]: '子系统',
  [MenuType.Directory]: '目录',
  [MenuType.Menu]:      '菜单',
  [MenuType.Operation]: '操作',
}

export enum MenuIconType {
  Icon    = 1,
  Picture = 2,
}

export const MenuIconTypeLabels: Record<MenuIconType, string> = {
  [MenuIconType.Icon]:    '图标',
  [MenuIconType.Picture]: '图片',
}

/** 平台类型：0=全部（仅查询），1/2/4/8 与 role 服务一致 */
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

export const PLATFORM_OPTIONS = [
  { value: PlatformType.Admin,   label: '超管' },
  { value: PlatformType.Pc,      label: 'PC端' },
  { value: PlatformType.Mini,    label: '小程序' },
  { value: PlatformType.Android, label: 'App' },
]

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface MenuDto {
  /** 雪花 ID，后端 JsonLong 序列化为字符串，前端须全程按 string 传递以免精度丢失 */
  id: string
  name: string
  code: string
  parentId: string
  type: MenuType
  icon: string
  iconType: MenuIconType
  activeIcon: string
  activeIconType: MenuIconType
  url: string
  order: number
  remark: string
  isVisible: boolean
  isExternalLink: boolean
  isLeaf: boolean
  platformType: number
  updatedAt: string
}

export interface MenuTreeDto extends MenuDto {
  children?: MenuTreeDto[]
}

export interface CreateMenuDto {
  name: string
  code: string
  /** 非根节点时传字符串形式的父级 ID（与后端 long 字符串 JSON 一致） */
  parentId?: string | null
  type: MenuType
  platformType: number
  icon?: string
  iconType?: MenuIconType
  activeIcon?: string
  activeIconType?: MenuIconType
  url?: string
  order?: number
  isVisible?: boolean
  isExternalLink?: boolean
  remark?: string
}

export interface MenuResourceDto {
  id: string
  name: string
  code: string
  routePattern: string
  isChecked: boolean
  operations?: MenuResourceDto[]
}

export interface SelectOptionDto {
  label: string
  value: string
  children?: SelectOptionDto[]
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface MenuTreeQueryDto {
  parentId?: string
  includeChilds?: boolean
}

// ─── API ────────────────────────────────────────────────────────────────────

export const MenuApi = {
  getTree: (platformType: number, params?: MenuTreeQueryDto) => {
    const finalParams: MenuTreeQueryDto = {
      includeChilds: true,
      ...(params ?? {}),
    }

    return http.get<MenuTreeDto[]>(
      buildUrl(
        `/Menu/tree/${platformType}`,
        finalParams as Record<string, string | number | boolean | undefined | null>,
      ),
    )
  },

  getUserTree: (platformType: number) => 
    http.get<MenuTreeDto[]>(buildUrl(`/Menu/usertree/${platformType}`)),

  getById: (id: string) =>
    http.get<MenuDto>(`/Menu/${id}`),

  getSelector: () =>
    http.get<SelectOptionDto[]>('/Menu/selector'),

  create: (data: CreateMenuDto) =>
    http.post<string>('/Menu', data),

  update: (id: string, data: CreateMenuDto) =>
    http.put<void>(`/Menu/${id}`, data),

  remove: (id: string) =>
    http.delete<void>(`/Menu/${id}`),

  getResources: (id: string) =>
    http.get<MenuResourceDto[]>(`/Menu/${id}/Resources`),

  bindResources: (id: string, resourceIds: string[]) =>
    http.put<void>(`/Menu/${id}/bind`, resourceIds),
}

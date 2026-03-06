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
  id: number
  name: string
  code: string
  parentId: number
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
  parentId?: number | null
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
  id: number
  name: string
  code: string
  routePattern: string
  isChecked: boolean
  operations?: MenuResourceDto[]
}

export interface SelectOptionDto {
  label: string
  value: number
  children?: SelectOptionDto[]
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface MenuTreeQueryDto {
  parentId?: number
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

  getById: (id: number) =>
    http.get<MenuDto>(`/Menu/${id}`),

  getSelector: () =>
    http.get<SelectOptionDto[]>('/Menu/selector'),

  create: (data: CreateMenuDto) =>
    http.post<number>('/Menu', data),

  update: (id: number, data: CreateMenuDto) =>
    http.put<void>(`/Menu/${id}`, data),

  remove: (id: number) =>
    http.delete<void>(`/Menu/${id}`),

  getResources: (id: number) =>
    http.get<MenuResourceDto[]>(`/Menu/${id}/Resources`),

  bindResources: (id: number, resourceIds: number[]) =>
    http.put<void>(`/Menu/${id}/bind`, resourceIds),
}

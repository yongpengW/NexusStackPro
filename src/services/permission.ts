import { http, buildUrl } from '@/utils/request'
import type { PermissionDto, ChangeRolePermissionDto } from '@/services/role'
import type { MenuResourceDto, MenuIconType, MenuType } from '@/services/menu'

export type { PermissionDto, ChangeRolePermissionDto }

/** 当前用户菜单权限节点（用于前端侧边栏与 useAccess） */
export interface RolePermissionDto {
  roleId: number
  menuId: number
  menuCode: string
  menuName: string
  parentId: number
  order: number
  menuUrl: string
  type: MenuType
  iconType: MenuIconType
  icon: string
  activeIcon: string
  activeIconType: MenuIconType
  isExternalLink: boolean
  children?: RolePermissionDto[]
}

export const PermissionApi = {
  /** GET /api/Role/permission — 获取全量菜单树及角色权限状态 */
  getRolePermission: (roleId: number, platformType: number) =>
    http.get<PermissionDto[]>(buildUrl('/Role/permission', { roleId, platformType })),

  /** POST /api/Role/permission/{roleId} — 保存角色权限 */
  saveRolePermission: (roleId: number, data: ChangeRolePermissionDto) =>
    http.post<void>(`/Role/permission/${roleId}`, data),

  /** GET /api/Menu/{id}/Resources — 查看 Operation 节点已绑定的 API 资源（只读） */
  getMenuResources: (menuId: number) =>
    http.get<MenuResourceDto[]>(`/Menu/${menuId}/Resources`),

  /** GET /api/Token/permission — 获取当前登录用户在指定平台下的菜单权限树 */
  getCurrentUserPermission: (platformType: number) =>
    http.get<RolePermissionDto[]>(buildUrl('/Token/permission', { platformType })),
}

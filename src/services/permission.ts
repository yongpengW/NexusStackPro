import { http, buildUrl } from '@/utils/request'
import type { PermissionDto, ChangeRolePermissionDto } from '@/services/role'
import type { MenuResourceDto } from '@/services/menu'

export type { PermissionDto, ChangeRolePermissionDto }

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
}

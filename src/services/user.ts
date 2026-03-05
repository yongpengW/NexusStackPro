import { http, buildUrl, fetchPagedData } from '@/utils/request'
import { PlatformType } from '@/services/role'

// ─── 枚举 ─────────────────────────────────────────────────────────────────────

export enum Gender {
  Unknown = 0,
  Male    = 1,
  Female  = 2,
}

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface UserRoleDto {
  id: number
  roleId: number
  roleName: string
  platforms: PlatformType
}

export interface UserDepartmentDto {
  userId: number
  departmentId: number
}

export interface UserDto {
  id: number
  userName: string
  realName: string
  nickName: string
  mobile: string
  email: string
  gender: Gender
  avatar: string
  isEnable: boolean
  hasPassword: boolean
  lastLoginTime: string
  userRoles: UserRoleDto[]
  departments: UserDepartmentDto[]
}

export interface CurrentUserDto extends UserDto {
  signatureUrl?: string | null
}

export interface CreateUserDto {
  userName: string
  realName?: string
  nickName?: string
  mobile: string
  email?: string
  gender?: Gender
  remark?: string
  isEnable: boolean
  userRoles: { roleId: number }[]
  departmentIds: number[]
}

export interface UserQueryParams {
  page?: number
  limit?: number
  userName?: string
  mobile?: string
  email?: string
  roleId?: number
  isEnable?: boolean
}

export interface ChangePasswordDto {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const UserApi = {
  /** GET /api/User/list — 分页列表 */
  getList: (params: UserQueryParams) =>
    fetchPagedData<UserDto>(
      buildUrl('/User/list', params as Record<string, string | number | boolean | undefined | null>),
    ),

  /** GET /api/User/{id} — 详情（含角色/组织） */
  getById: (id: number) =>
    http.get<UserDto>(`/User/${id}`),

  /** GET /api/User/me — 当前登录用户 */
  getMe: () =>
    http.get<CurrentUserDto>('/User/me'),

  /** POST /api/User — 新增 */
  create: (data: CreateUserDto) =>
    http.post<number>('/User', data),

  /** PUT /api/User/{id} — 编辑 */
  update: (id: number, data: CreateUserDto) =>
    http.put<void>(`/User/${id}`, data),

  /** DELETE /api/User/{id} — 删除 */
  remove: (id: number) =>
    http.delete<void>(`/User/${id}`),

  /** PUT /api/User/enable/{id} — 启用 */
  enable: (id: number) =>
    http.put<void>(`/User/enable/${id}`, {}),

  /** PUT /api/User/disable/{id} — 禁用 */
  disable: (id: number) =>
    http.put<void>(`/User/disable/${id}`, {}),

  /** PUT /api/User/reset/{id} — 重置密码 */
  resetPassword: (id: number) =>
    http.put<void>(`/User/reset/${id}`, {}),

  /** PUT /api/User/me/password — 当前用户修改自己的密码 */
  changePassword: (data: ChangePasswordDto) =>
    http.put<void>('/User/me/password', data),
}


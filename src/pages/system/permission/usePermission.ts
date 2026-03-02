import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { App } from 'antd'
import { RoleApi, PlatformType, DataRange } from '@/services/role'
import type { RoleDto } from '@/services/role'
import { PermissionApi } from '@/services/permission'
import type { PermissionDto, ChangeRolePermissionDto } from '@/services/permission'
import type { MenuResourceDto } from '@/services/menu'

export interface PermissionPageState {
  // 左栏
  platformType: PlatformType
  roleList: RoleDto[]
  selectedRoleId: number | null

  // 右栏
  permissionTree: PermissionDto[]
  /** 完全勾选的 menuId 集合（直接驱动 Tree checkedKeys） */
  checkedKeys: number[]
  /** 半选父节点 menuId 集合（提交时合并进 menus，dataRange 固定 All） */
  halfCheckedKeys: number[]
  /** menuId → DataRange 映射（仅含 checkedKeys 中的节点） */
  dataRangeMap: Record<number, DataRange>
  isDirty: boolean

  // API 绑定缓存（Operation 节点）
  expandedApiBindings: Record<number, MenuResourceDto[]>

  // 加载 / 保存状态
  loadingRoles: boolean
  loadingPermissions: boolean
  saving: boolean
}

export interface UsePermissionResult extends PermissionPageState {
  selectedRole: RoleDto | null
  isSystemRole: boolean

  // 角色 & 平台切换
  changePlatform: (next: PlatformType) => Promise<void>
  changeRole: (roleId: number) => Promise<void>

  // 勾选状态更新（Tree onCheck 回调）
  updateCheckState: (checked: number[], halfChecked: number[]) => void
  /** 单独更新某节点的 DataRange（不影响勾选状态） */
  updateDataRange: (menuId: number, dataRange: DataRange) => void
  checkAll: () => void
  clearAll: () => void

  // API 绑定查看
  loadApiBindings: (menuId: number) => Promise<MenuResourceDto[]>

  // 保存
  save: () => Promise<void>
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/** 收集所有 hasPermission=true 的节点，返回 menuId 列表 */
function collectCheckedIds(list: PermissionDto[]): number[] {
  const ids: number[] = []
  const walk = (items: PermissionDto[]) => {
    for (const p of items) {
      if (p.hasPermission) ids.push(p.menuId)
      if (p.children?.length) walk(p.children)
      if (p.operations?.length) walk(p.operations)
    }
  }
  walk(list)
  return ids
}

/** 收集所有 hasPermission=true 的节点，返回 menuId → DataRange 映射 */
function collectCheckedDataRanges(list: PermissionDto[]): Record<number, DataRange> {
  const map: Record<number, DataRange> = {}
  const walk = (items: PermissionDto[]) => {
    for (const p of items) {
      if (p.hasPermission) map[p.menuId] = p.dataRange ?? DataRange.All
      if (p.children?.length) walk(p.children)
      if (p.operations?.length) walk(p.operations)
    }
  }
  walk(list)
  return map
}

/** 收集树中全量 menuId（用于全选） */
function collectAllMenuIds(list: PermissionDto[]): number[] {
  const ids: number[] = []
  const walk = (items: PermissionDto[]) => {
    for (const p of items) {
      ids.push(p.menuId)
      if (p.children?.length) walk(p.children)
      if (p.operations?.length) walk(p.operations)
    }
  }
  walk(list)
  return ids
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePermission(): UsePermissionResult {
  const { message } = App.useApp()

  const [platformType, setPlatformType] = useState<PlatformType>(PlatformType.Admin)
  const [roleList, setRoleList] = useState<RoleDto[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)

  const [permissionTree, setPermissionTree] = useState<PermissionDto[]>([])
  const [checkedKeys, setCheckedKeys] = useState<number[]>([])
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<number[]>([])
  const [dataRangeMap, setDataRangeMap] = useState<Record<number, DataRange>>({})
  const [isDirty, setIsDirty] = useState(false)

  const [expandedApiBindings, setExpandedApiBindings] = useState<Record<number, MenuResourceDto[]>>({})

  const [loadingRoles, setLoadingRoles] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedRole = useMemo(
    () => roleList.find((r) => r.id === selectedRoleId) ?? null,
    [roleList, selectedRoleId],
  )

  const isSystemRole = !!selectedRole?.isSystem

  const resetPermissionState = () => {
    setPermissionTree([])
    setCheckedKeys([])
    setHalfCheckedKeys([])
    setDataRangeMap({})
    setIsDirty(false)
  }

  const loadPermissions = async (roleId: number, platform: PlatformType) => {
    setLoadingPermissions(true)
    try {
      const data = await PermissionApi.getRolePermission(roleId, platform)
      const tree = data ?? []
      setPermissionTree(tree)
      setCheckedKeys(collectCheckedIds(tree))
      setHalfCheckedKeys([])
      setDataRangeMap(collectCheckedDataRanges(tree))
      setIsDirty(false)
    } catch (err: any) {
      message.error(err?.message || '加载权限树失败')
      resetPermissionState()
    } finally {
      setLoadingPermissions(false)
    }
  }

  const loadRoles = async (platform: PlatformType) => {
    setLoadingRoles(true)
    try {
      const res = await RoleApi.getList(platform, { page: 1, limit: 1000, isEnable: true })
      const list = res.items ?? []
      setRoleList(list)

      if (!list.length) {
        setSelectedRoleId(null)
        resetPermissionState()
        return
      }

      const firstNonSystem = list.find((r) => !r.isSystem)
      const defaultRole = firstNonSystem ?? list[0]
      setSelectedRoleId(defaultRole.id)
      await loadPermissions(defaultRole.id, platform)
    } catch (err: any) {
      message.error(err?.message || '加载角色列表失败')
      setRoleList([])
      setSelectedRoleId(null)
      resetPermissionState()
    } finally {
      setLoadingRoles(false)
    }
  }

  useEffect(() => {
    loadRoles(platformType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changePlatform = async (next: PlatformType) => {
    if (next === platformType) return
    setPlatformType(next)
    setExpandedApiBindings({})
    await loadRoles(next)
  }

  const changeRole = async (roleId: number) => {
    if (roleId === selectedRoleId) return
    setSelectedRoleId(roleId)
    setExpandedApiBindings({})
    await loadPermissions(roleId, platformType)
  }

  const updateCheckState = (checked: number[], halfChecked: number[]) => {
    setCheckedKeys(checked)
    setHalfCheckedKeys(halfChecked)
    // 重新构建 dataRangeMap：保留已勾选节点的原有值，新节点赋 All，
    // 取消勾选的节点因不出现在 checked 中而自动被丢弃。
    // halfChecked 父节点不进入 dataRangeMap（提交时统一 All）。
    setDataRangeMap((prev) => {
      const next: Record<number, DataRange> = {}
      for (const id of checked) {
        next[id] = prev[id] ?? DataRange.All
      }
      return next
    })
    setIsDirty(true)
  }

  const updateDataRange = (menuId: number, dataRange: DataRange) => {
    setDataRangeMap((prev) => ({ ...prev, [menuId]: dataRange }))
    setIsDirty(true)
  }

  const checkAll = () => {
    if (!permissionTree.length) return
    const allIds = collectAllMenuIds(permissionTree)
    setCheckedKeys(allIds)
    setHalfCheckedKeys([])
    setDataRangeMap((prev) => {
      const next: Record<number, DataRange> = {}
      for (const id of allIds) {
        next[id] = prev[id] ?? DataRange.All
      }
      return next
    })
    setIsDirty(true)
  }

  const clearAll = () => {
    setCheckedKeys([])
    setHalfCheckedKeys([])
    setDataRangeMap({})
    setIsDirty(true)
  }

  // expandedApiBindings 用 ref 辅助读取，保持 loadApiBindings 引用稳定
  const expandedApiBindingsRef = useRef(expandedApiBindings)
  expandedApiBindingsRef.current = expandedApiBindings

  const loadApiBindings = useCallback(async (menuId: number): Promise<MenuResourceDto[]> => {
    if (expandedApiBindingsRef.current[menuId]) {
      return expandedApiBindingsRef.current[menuId]
    }
    try {
      const data = await PermissionApi.getMenuResources(menuId)
      setExpandedApiBindings((prev) => ({ ...prev, [menuId]: data ?? [] }))
      return data ?? []
    } catch (err: any) {
      message.error(err?.message || '加载 API 绑定失败')
      return []
    }
  // message 来自 App.useApp()，引用稳定；PermissionApi 是模块常量
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  const save = async () => {
    if (!selectedRoleId) return

    const allMenuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))
    const payload: ChangeRolePermissionDto = {
      roleId: selectedRoleId,
      platformType,
      menus: allMenuIds.map((menuId) => ({
        menuId,
        // halfChecked 父节点不在 dataRangeMap 中，固定用 All
        dataRange: dataRangeMap[menuId] ?? DataRange.All,
      })),
    }

    setSaving(true)
    try {
      await PermissionApi.saveRolePermission(selectedRoleId, payload)
      message.success(
        payload.menus.length === 0 ? '已清空该角色权限' : '权限保存成功，已实时生效',
      )
      setIsDirty(false)
      await loadPermissions(selectedRoleId, platformType)
    } catch (err: any) {
      message.error(err?.message || '保存权限失败')
    } finally {
      setSaving(false)
    }
  }

  return {
    platformType,
    roleList,
    selectedRoleId,
    permissionTree,
    checkedKeys,
    halfCheckedKeys,
    dataRangeMap,
    isDirty,
    expandedApiBindings,
    loadingRoles,
    loadingPermissions,
    saving,
    selectedRole,
    isSystemRole,
    changePlatform,
    changeRole,
    updateCheckState,
    updateDataRange,
    checkAll,
    clearAll,
    loadApiBindings,
    save,
  }
}

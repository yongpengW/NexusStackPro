import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { PermissionApi, type RolePermissionDto } from '@/services/permission'
import { PlatformType } from '@/services/role'
import { MenuType } from '@/services/menu'

export interface AccessResult {
  /** 是否正在加载当前用户权限数据 */
  loading: boolean
  /** 是否已经尝试加载过一次（即使失败） */
  initialized: boolean
  /** 当前用户在该平台下拥有的全部菜单 Code（含目录/菜单/操作） */
  menuCodes: string[]
  /** 仅 Operation 类型节点的菜单 Code（推荐用于按钮级权限） */
  operationCodes: string[]

  /** 判断是否拥有指定菜单 Code 权限（目录/菜单/操作通用） */
  hasMenu: (code: string) => boolean
  /** 判断是否拥有指定操作 Code 权限（仅 Operation 节点） */
  hasOperation: (code: string) => boolean
  /** 只要列表中任一 Code 命中即可 */
  hasAnyMenu: (codes: string[]) => boolean
  /** 需要列表中所有 Code 都命中 */
  hasAllMenus: (codes: string[]) => boolean
}

function flattenPermissions(list: RolePermissionDto[]): RolePermissionDto[] {
  const result: RolePermissionDto[] = []

  const walk = (nodes: RolePermissionDto[]) => {
    for (const n of nodes) {
      result.push(n)
      if (n.children?.length) {
        walk(n.children)
      }
    }
  }

  walk(list)
  return result
}

/**
 * useAccess：基于后端 /Token/permission 接口的前端权限 Hook。
 *
 * - 依赖登录态（access token），仅在已登录时请求当前用户菜单权限；
 * - 默认针对 PC 管理端平台（PlatformType.Pc = 2）加载权限树；
 * - 返回一组基于 Menu.Code 的布尔判断方法，供路由/菜单/按钮使用。
 */
export function useAccess(): AccessResult {
  const token = useAppStore((s) => s.token)

  // 当前前端为 PC 管理端，对应后端 PlatformType.Pc = 2。
  const platformType = PlatformType.Pc

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ['currentUserPermission', platformType],
    queryFn: () => PermissionApi.getCurrentUserPermission(platformType),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const { menuCodes, operationCodes } = useMemo(() => {
    if (!data || data.length === 0) {
      return { menuCodes: [] as string[], operationCodes: [] as string[] }
    }

    const all = flattenPermissions(data)
    const allCodes = new Set<string>()
    const opCodes = new Set<string>()

    for (const item of all) {
      if (item.menuCode) {
        allCodes.add(item.menuCode)
        if (item.type === MenuType.Operation) {
          opCodes.add(item.menuCode)
        }
      }
    }

    return {
      menuCodes: Array.from(allCodes),
      operationCodes: Array.from(opCodes),
    }
  }, [data])

  const hasMenu = (code: string) => menuCodes.includes(code)
  const hasOperation = (code: string) => operationCodes.includes(code)
  const hasAnyMenu = (codes: string[]) => codes.some((c) => hasMenu(c))
  const hasAllMenus = (codes: string[]) => codes.every((c) => hasMenu(c))

  return {
    loading: isLoading,
    initialized: isFetched,
    menuCodes,
    operationCodes,
    hasMenu,
    hasOperation,
    hasAnyMenu,
    hasAllMenus,
  }
}


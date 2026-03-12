import { useAppStore } from '@/store/useAppStore'

export interface AccessResult {
  /** 是否正在加载当前用户权限数据（未初始化前视为 loading） */
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

/**
 * useAccess：基于 useAppStore 中的权限状态的前端权限 Hook。
 *
 * - 权限数据由上层（如 AuthGuard）在登录后通过 /Token/permission 拉取并写入 Store；
 * - Hook 本身只做读取与布尔判断封装，不再触发网络请求；
 * - 返回一组基于 Menu.Code 的布尔判断方法，供路由/菜单/按钮使用。
 */
export function useAccess(): AccessResult {
  const initialized = useAppStore((s) => s.accessInitialized)
  const menuCodes = useAppStore((s) => s.accessMenuCodes)
  const operationCodes = useAppStore((s) => s.accessOperationCodes)

  const hasMenu = (code: string) => menuCodes.includes(code)
  const hasOperation = (code: string) => operationCodes.includes(code)
  const hasAnyMenu = (codes: string[]) => codes.some((c) => hasMenu(c))
  const hasAllMenus = (codes: string[]) => codes.every((c) => hasMenu(c))

  return {
    loading: !initialized,
    initialized,
    menuCodes,
    operationCodes,
    hasMenu,
    hasOperation,
    hasAnyMenu,
    hasAllMenus,
  }
}


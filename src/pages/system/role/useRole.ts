import { useState, useCallback } from 'react'
import { App } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { isBusinessError } from '@/utils/request'
import { RoleApi } from '@/services/role'
import type { RoleDto } from '@/services/role'

export const ROLE_QUERY_KEYS = {
  detail:     (id: number) => ['role', 'detail', id] as const,
  selector:   ['role', 'selector'] as const,
  permission: (roleId: number, platformType: number) =>
    ['role', 'permission', roleId, platformType] as const,
}

/**
 * @param reload — ProTable 刷新回调，由页面通过 actionRef.reload() 提供
 */
export function useRole(reload: () => void) {
  const { message, modal } = App.useApp()
  const [operatingId, setOperatingId] = useState<number | null>(null)

  // ─── 启用 ────────────────────────────────────────────────────────────────
  const enableMutation = useMutation({
    mutationFn: (id: number) => RoleApi.enable(id),
    onSuccess: () => { message.success('已启用'); reload() },
    onError:   (err: Error) => {
      if (isBusinessError(err)) message.error(err.message ?? '操作失败')
    },
    onSettled: () => setOperatingId(null),
  })

  // ─── 禁用 ────────────────────────────────────────────────────────────────
  const disableMutation = useMutation({
    mutationFn: (id: number) => RoleApi.disable(id),
    onSuccess: () => { message.success('已禁用'); reload() },
    onError:   (err: Error) => {
      if (isBusinessError(err)) message.error(err.message ?? '操作失败')
    },
    onSettled: () => setOperatingId(null),
  })

  // ─── 删除 ────────────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (id: number) => RoleApi.remove(id),
    onSuccess: () => { message.success('删除成功'); reload() },
    onError:   (err: Error) => {
      if (isBusinessError(err)) message.error(err.message ?? '删除失败')
    },
    onSettled: () => setOperatingId(null),
  })

  // ─── 操作入口 ─────────────────────────────────────────────────────────────

  const handleEnable = useCallback(
    (id: number) => {
      setOperatingId(id)
      enableMutation.mutate(id)
    },
    [enableMutation],
  )

  const handleDisable = useCallback(
    (record: RoleDto) => {
      modal.confirm({
        title:      '确认禁用',
        content:    `确认禁用角色"${record.name}"？若有用户绑定，服务端将拒绝并提示。`,
        okText:     '确认禁用',
        cancelText: '取消',
        okType:     'danger',
        onOk: () => {
          setOperatingId(record.id)
          return disableMutation.mutateAsync(record.id)
        },
      })
    },
    [modal, disableMutation],
  )

  const handleDelete = useCallback(
    (record: RoleDto) => {
      modal.confirm({
        title:      '确认删除',
        content:    `确认删除角色"${record.name}"？删除后不可恢复。`,
        okType:     'danger',
        okText:     '删除',
        cancelText: '取消',
        onOk: () => {
          setOperatingId(record.id)
          return removeMutation.mutateAsync(record.id)
        },
      })
    },
    [modal, removeMutation],
  )

  return { operatingId, handleEnable, handleDisable, handleDelete }
}

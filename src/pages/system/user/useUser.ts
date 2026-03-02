import { useState, useCallback } from 'react'
import { App } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { UserApi } from '@/services/user'
import type { UserDto } from '@/services/user'

export function useUser(reload: () => void) {
  const { message, modal } = App.useApp()
  const [operatingId, setOperatingId] = useState<number | null>(null)

  const enableMutation = useMutation({
    mutationFn: (id: number) => UserApi.enable(id),
    onSuccess: () => {
      message.success('已启用')
      reload()
    },
    onError: (err: Error) => message.error(err.message ?? '操作失败'),
    onSettled: () => setOperatingId(null),
  })

  const disableMutation = useMutation({
    mutationFn: (id: number) => UserApi.disable(id),
    onSuccess: () => {
      message.success('已禁用')
      reload()
    },
    onError: (err: Error) => message.error(err.message ?? '操作失败'),
    onSettled: () => setOperatingId(null),
  })

  const resetMutation = useMutation({
    mutationFn: (id: number) => UserApi.resetPassword(id),
    onSuccess: () => {
      message.success('密码已重置为手机号后6位')
      reload()
    },
    onError: (err: Error) => message.error(err.message ?? '操作失败'),
    onSettled: () => setOperatingId(null),
  })

  const removeMutation = useMutation({
    mutationFn: (id: number) => UserApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      reload()
    },
    onError: (err: Error) => message.error(err.message ?? '删除失败'),
    onSettled: () => setOperatingId(null),
  })

  const handleEnable = useCallback(
    (id: number) => {
      setOperatingId(id)
      enableMutation.mutate(id)
    },
    [enableMutation],
  )

  const handleDisable = useCallback(
    (record: UserDto) => {
      modal.confirm({
        title: '确认禁用',
        content: '禁用后该用户将无法登录系统，确认禁用？',
        okText: '确认禁用',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          setOperatingId(record.id)
          return disableMutation.mutateAsync(record.id)
        },
      })
    },
    [modal, disableMutation],
  )

  const handleResetPassword = useCallback(
    (record: UserDto) => {
      modal.confirm({
        title: '重置密码',
        content: '重置后密码将恢复为手机号后6位，确认重置？',
        okText: '确认重置',
        cancelText: '取消',
        onOk: () => {
          setOperatingId(record.id)
          return resetMutation.mutateAsync(record.id)
        },
      })
    },
    [modal, resetMutation],
  )

  const handleDelete = useCallback(
    (record: UserDto) => {
      modal.confirm({
        title: '确认删除',
        content: '删除后数据不可恢复，确认删除该用户？',
        okType: 'danger',
        okText: '删除',
        cancelText: '取消',
        onOk: () => {
          setOperatingId(record.id)
          return removeMutation.mutateAsync(record.id)
        },
      })
    },
    [modal, removeMutation],
  )

  return {
    operatingId,
    handleEnable,
    handleDisable,
    handleResetPassword,
    handleDelete,
  }
}


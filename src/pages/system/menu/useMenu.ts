import { useState, useCallback } from 'react'
import { App } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isBusinessError } from '@/utils/request'
import { MenuApi } from '@/services/menu'
import type { MenuTreeDto, MenuDto } from '@/services/menu'

export const MENU_QUERY_KEYS = {
  tree: (platformType: number) => ['menu', 'tree', platformType] as const,
  detail: (id: string) => ['menu', 'detail', id] as const,
  selector: ['menu', 'selector'] as const,
  resources: (id: string) => ['menu', 'resources', id] as const,
}

export function useMenu(platformType: number) {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const [operatingId, setOperatingId] = useState<string | null>(null)

  const treeQuery = useQuery({
    queryKey: MENU_QUERY_KEYS.tree(platformType),
    queryFn: () => MenuApi.getTree(platformType),
  })

  const dataSource: MenuTreeDto[] = treeQuery.data ?? []
  const isLoading = treeQuery.isLoading

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['menu'] })
  }, [queryClient])

  const removeMutation = useMutation({
    mutationFn: (id: string) => MenuApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      refresh()
    },
    onError: (err: Error) => {
      if (isBusinessError(err)) message.error(err.message ?? '删除失败')
    },
    onSettled: () => setOperatingId(null),
  })

  const handleDelete = useCallback(
    (record: MenuDto) => {
      modal.confirm({
        title: '确认删除',
        content: `确认删除菜单"${record.name}"？删除后不可恢复。`,
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
    dataSource,
    isLoading,
    operatingId,
    refresh,
    handleDelete,
  }
}

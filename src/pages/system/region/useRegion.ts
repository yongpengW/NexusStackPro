import { useState, useCallback } from 'react'
import { App } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RegionApi } from '@/services/region'
import type { RegionTreeDto, RegionDto } from '@/services/region'

export const REGION_QUERY_KEYS = {
  tree: ['region', 'tree'] as const,
  list: (keyword: string) => ['region', 'list', keyword] as const,
  detail: (id: number) => ['region', 'detail', id] as const,
  selector: ['region', 'selector'] as const,
}

export function useRegion() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()

  // ─── 搜索状态 ────────────────────────────────────────────────────────────
  const [keyword, setKeyword] = useState('')
  /** 当前正在进行启用/禁用/删除操作的行 id */
  const [operatingId, setOperatingId] = useState<number | null>(null)

  // ─── 树形数据（无关键词时） ──────────────────────────────────────────────
  const treeQuery = useQuery({
    queryKey: REGION_QUERY_KEYS.tree,
    queryFn: () => RegionApi.getTree(),
    enabled: !keyword,
  })

  // ─── 扁平搜索结果（有关键词时） ──────────────────────────────────────────
  const listQuery = useQuery({
    queryKey: REGION_QUERY_KEYS.list(keyword),
    queryFn: () => RegionApi.getList({ keyword }),
    enabled: !!keyword,
  })

  const isLoading = keyword ? listQuery.isLoading : treeQuery.isLoading
  const dataSource: (RegionTreeDto | RegionDto)[] = keyword
    ? (listQuery.data ?? [])
    : (treeQuery.data ?? [])

  // ─── 刷新 ────────────────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['region'] })
  }, [queryClient])

  // ─── 启用 ────────────────────────────────────────────────────────────────
  const enableMutation = useMutation({
    mutationFn: (id: number) => RegionApi.enable(id),
    onSuccess: () => {
      message.success('已启用')
      refresh()
    },
    onError: (err: Error) => message.error(err.message ?? '操作失败'),
    onSettled: () => setOperatingId(null),
  })

  // ─── 禁用 ────────────────────────────────────────────────────────────────
  const disableMutation = useMutation({
    mutationFn: (id: number) => RegionApi.disable(id),
    onSuccess: () => {
      message.success('已禁用')
      refresh()
    },
    onError: (err: Error) => message.error(err.message ?? '操作失败'),
    onSettled: () => setOperatingId(null),
  })

  // ─── 删除 ────────────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (id: number) => RegionApi.remove(id),
    onSuccess: () => {
      message.success('删除成功')
      refresh()
    },
    onError: (err: Error) => message.error(err.message ?? '删除失败'),
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
    (record: RegionDto) => {
      modal.confirm({
        title: '确认禁用',
        content: `禁用后，该区域下的用户数据范围将受到限制，确认禁用"${record.name}"？`,
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

  const handleDelete = useCallback(
    (record: RegionDto) => {
      modal.confirm({
        title: '确认删除',
        content: `确认删除区域"${record.name}"？删除后不可恢复。`,
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
    keyword,
    setKeyword,
    isLoading,
    dataSource,
    operatingId,
    refresh,
    handleEnable,
    handleDisable,
    handleDelete,
  }
}

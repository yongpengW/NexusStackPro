import { useState, useEffect, useMemo } from 'react'
import {
  App,
  Alert,
  Button,
  Checkbox,
  Collapse,
  Drawer,
  Empty,
  Input,
  Space,
  Spin,
  Tag,
} from 'antd'
import { ExpandAltOutlined, ShrinkOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { isBusinessError } from '@/utils/request'
import { MenuApi, type MenuDto, type MenuResourceDto } from '@/services/menu'
import { MENU_QUERY_KEYS } from './useMenu'

interface ResourceDrawerProps {
  open: boolean
  menu: MenuDto | null
  onClose: () => void
}

function collectCheckedIds(list: MenuResourceDto[]): string[] {
  const ids: string[] = []
  for (const group of list) {
    if (group.operations?.length) {
      for (const op of group.operations) {
        if (op.isChecked) ids.push(op.id)
      }
    }
  }
  return ids
}

function getMethodColor(method?: string) {
  switch ((method ?? '').toUpperCase()) {
    case 'GET':
      return 'green'
    case 'POST':
      return 'blue'
    case 'PUT':
      return 'orange'
    case 'DELETE':
      return 'red'
    default:
      return 'default'
  }
}

export function ResourceDrawer({ open, menu, onClose }: ResourceDrawerProps) {
  const { message } = App.useApp()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  const menuId = menu?.id ?? ''

  const resourceQuery = useQuery({
    queryKey: MENU_QUERY_KEYS.resources(menuId),
    queryFn: () => MenuApi.getResources(menuId),
    enabled: open && !!menu && menuId !== '',
  })

  const groups = useMemo(() => resourceQuery.data ?? [], [resourceQuery.data])
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [activeKeys, setActiveKeys] = useState<string[]>([])

  useEffect(() => {
    if (resourceQuery.data) {
      setCheckedIds(collectCheckedIds(resourceQuery.data))
      setErrorMsg(null)
    }
  }, [resourceQuery.data])

  const groupStateMap = useMemo(() => {
    const map = new Map<
      string,
      { groupId: string; childIds: string[]; allChecked: boolean; indeterminate: boolean }
    >()
    groups.forEach((g) => {
      const childIds = (g.operations ?? []).map((op) => op.id)
      const checkedCount = childIds.filter((id) => checkedIds.includes(id)).length
      const allChecked = childIds.length > 0 && checkedCount === childIds.length
      const indeterminate = checkedCount > 0 && checkedCount < childIds.length
      map.set(g.code, { groupId: g.code, childIds, allChecked, indeterminate })
    })
    return map
  }, [groups, checkedIds])

  const filteredGroups = useMemo(() => {
    if (!searchKeyword.trim()) return groups
    const kw = searchKeyword.trim().toLowerCase()
    return (groups
      .map((g) => {
        const filteredOps = (g.operations ?? []).filter((op) => {
          const text = [
            op.name,
            op.code,
            op.routePattern,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return text.includes(kw)
        })
        if (!filteredOps.length) return null
        return { ...g, operations: filteredOps }
      })
      .filter(Boolean) as MenuResourceDto[])
  }, [groups, searchKeyword])

  useEffect(() => {
    // 只在真正需要时更新 activeKeys，避免在空数组状态下反复 setState 触发无限渲染
    if (!open || groups.length === 0) {
      setActiveKeys((prev) => (prev.length ? [] : prev))
      return
    }
    const nextKeys = groups.map((g) => g.code)
    setActiveKeys((prev) => {
      if (prev.length === nextKeys.length && prev.every((k, idx) => k === nextKeys[idx])) {
        return prev
      }
      return nextKeys
    })
  }, [open, groups])

  const handleGroupToggle = (childIds: string[], checkAll: boolean) => {
    setCheckedIds((prev) => {
      const set = new Set(prev)
      if (checkAll) {
        childIds.forEach((id) => set.add(id))
      } else {
        childIds.forEach((id) => set.delete(id))
      }
      return Array.from(set)
    })
  }

  const handleCheckboxChange = (groupChildIds: string[], list: string[]) => {
    const selected = list
    setCheckedIds((prev) => {
      const others = prev.filter((id) => !groupChildIds.includes(id))
      return [...others, ...selected]
    })
  }

  const saveMutation = useMutation({
    mutationFn: () => MenuApi.bindResources(menuId, checkedIds),
    onSuccess: () => {
      message.success('接口绑定已保存')
      setErrorMsg(null)
      onClose()
    },
    onError: (err: Error) => {
      if (isBusinessError(err)) setErrorMsg(err.message ?? '保存失败')
    },
  })

  const title = `绑定接口：${menu?.name ?? ''}`

  return (
    <Drawer
      title={title}
      width={640}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              loading={saveMutation.isPending}
              disabled={!menu || groups.length === 0}
              onClick={() => saveMutation.mutate()}
            >
              保存绑定
            </Button>
          </Space>
        </div>
      }
    >
      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 12 }}
          onClose={() => setErrorMsg(null)}
        />
      )}

      <Spin spinning={resourceQuery.isLoading}>
        {!resourceQuery.isLoading && groups.length === 0 ? (
          <Empty description="暂无 API 资源，请先运行后端服务以自动注册" />
        ) : (
          <>
            <Space
              style={{
                marginBottom: 12,
                width: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Input.Search
                allowClear
                placeholder="搜索接口名称、路径或编码"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 260 }}
              />
              <Space>
                <Button
                  type="link"
                  size="small"
                  disabled={filteredGroups.length === 0}
                  onClick={() => setActiveKeys(filteredGroups.map((g) => g.code))}
                >
                  <ExpandAltOutlined />
                  展开
                </Button>
                <Button
                  type="link"
                  size="small"
                  disabled={filteredGroups.length === 0}
                  onClick={() => setActiveKeys([])}
                >
                  <ShrinkOutlined />
                  收起
                </Button>
              </Space>
            </Space>

            <Collapse
              activeKey={activeKeys}
              onChange={(keys) =>
                setActiveKeys(Array.isArray(keys) ? (keys as string[]) : [keys as string])
              }
              bordered={false}
              items={filteredGroups.map((g) => {
                const state = groupStateMap.get(g.code)
              const children = g.operations ?? []
              const groupLabel = (
                <Space>
                  <span>{g.name}</span>
                  <Tag color="default" style={{ fontSize: 12 }}>
                    {g.code}
                  </Tag>
                </Space>
                )
                return {
                  key: g.code,
                  label: groupLabel,
                  children: (
                    <>
                      <Space style={{ marginBottom: 8 }}>
                        <Checkbox
                          indeterminate={state?.indeterminate}
                          checked={state?.allChecked}
                          onChange={(e) =>
                            handleGroupToggle(state?.childIds ?? [], e.target.checked)
                          }
                        >
                          全选
                        </Checkbox>
                      </Space>
                      <br />
                      <Checkbox.Group
                        style={{ width: '100%' }}
                        value={checkedIds.filter((id) => state?.childIds.includes(id))}
                        onChange={(list) => handleCheckboxChange(state?.childIds ?? [], list)}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {children.map((op) => {
                            const [routeTemplate, method] = op.code.split(':')
                            return (
                              <Checkbox key={op.id} value={op.id}>
                                <Space>
                                  {method && (
                                    <Tag color={getMethodColor(method)}>{method}</Tag>
                                  )}
                                  <span>{op.routePattern || routeTemplate}</span>
                                  <span style={{ color: 'var(--ant-color-text-tertiary)' }}>
                                    {op.name}
                                  </span>
                                </Space>
                              </Checkbox>
                            )
                          })}
                        </Space>
                      </Checkbox.Group>
                    </>
                  ),
                }
              })}
            />
          </>
        )}
      </Spin>
    </Drawer>
  )
}


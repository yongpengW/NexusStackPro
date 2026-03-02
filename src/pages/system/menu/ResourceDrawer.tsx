import { useState, useEffect, useMemo } from 'react'
import {
  App,
  Alert,
  Button,
  Checkbox,
  Collapse,
  Drawer,
  Empty,
  Space,
  Spin,
  Tag,
} from 'antd'
import type { CheckboxValueType } from 'antd/es/checkbox/Group'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MenuApi, type MenuDto, type MenuResourceDto } from '@/services/menu'
import { MENU_QUERY_KEYS } from './useMenu'

const { Panel } = Collapse

interface ResourceDrawerProps {
  open: boolean
  menu: MenuDto | null
  onClose: () => void
}

function collectCheckedIds(list: MenuResourceDto[]): number[] {
  const ids: number[] = []
  for (const group of list) {
    if (group.operations?.length) {
      for (const op of group.operations) {
        if (op.isChecked) ids.push(op.id)
      }
    }
  }
  return ids
}

export function ResourceDrawer({ open, menu, onClose }: ResourceDrawerProps) {
  const { message } = App.useApp()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const menuId = menu?.id ?? 0

  const resourceQuery = useQuery({
    queryKey: MENU_QUERY_KEYS.resources(menuId),
    queryFn: () => MenuApi.getResources(menuId),
    enabled: open && !!menu,
  })

  const groups = resourceQuery.data ?? []

  const [checkedIds, setCheckedIds] = useState<number[]>([])

  useEffect(() => {
    if (resourceQuery.data) {
      setCheckedIds(collectCheckedIds(resourceQuery.data))
      setErrorMsg(null)
    }
  }, [resourceQuery.data])

  const groupStates = useMemo(() => {
    return groups.map((g) => {
      const childIds = (g.operations ?? []).map((op) => op.id)
      const checkedCount = childIds.filter((id) => checkedIds.includes(id)).length
      const allChecked = childIds.length > 0 && checkedCount === childIds.length
      const indeterminate = checkedCount > 0 && checkedCount < childIds.length
      return { groupId: g.code, childIds, allChecked, indeterminate }
    })
  }, [groups, checkedIds])

  const handleGroupToggle = (childIds: number[], checkAll: boolean) => {
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

  const handleCheckboxChange = (groupChildIds: number[], list: CheckboxValueType[]) => {
    const selected = list as number[]
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
    },
    onError: (err: Error) => setErrorMsg(err.message ?? '保存失败'),
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
          <Collapse defaultActiveKey={groups.map((g) => g.code)} bordered={false}>
            {groups.map((g, idx) => {
              const state = groupStates[idx]
              const children = g.operations ?? []
              const groupLabel = (
                <Space>
                  <span>{g.name}</span>
                  <Tag color="default" style={{ fontSize: 12 }}>
                    {g.code}
                  </Tag>
                </Space>
              )
              return (
                <Panel header={groupLabel} key={g.code}>
                  <Space style={{ marginBottom: 8 }}>
                    <Checkbox
                      indeterminate={state?.indeterminate}
                      checked={state?.allChecked}
                      onChange={(e) => handleGroupToggle(state?.childIds ?? [], e.target.checked)}
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
                                <Tag color="blue">{method}</Tag>
                              )}
                              <span>{op.routePattern || routeTemplate}</span>
                              <span style={{ color: 'var(--ant-color-text-tertiary)' }}>{op.name}</span>
                            </Space>
                          </Checkbox>
                        )
                      })}
                    </Space>
                  </Checkbox.Group>
                </Panel>
              )
            })}
          </Collapse>
        )}
      </Spin>
    </Drawer>
  )
}


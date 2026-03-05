import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Drawer, Empty, Popconfirm, Select, Space, Spin, Tag, Tree } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { ExpandAltOutlined, ShrinkOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import type { PermissionDto } from '@/services/role'
import { MenuType, DataRange, DATA_RANGE_OPTIONS } from '@/services/role'
import type { MenuResourceDto } from '@/services/menu'

interface PermissionTreeProps {
  platformLabel: string
  platformColor: string
  roleName: string | undefined
  isSystemRole: boolean
  loading: boolean
  saving: boolean
  permissionTree: PermissionDto[]
  checkedKeys: number[]
  /** menuId → DataRange 映射（仅含已勾选节点） */
  dataRangeMap: Record<number, DataRange>
  expandedApiBindings: Record<number, MenuResourceDto[]>
  onCheckChange: (checked: number[], halfChecked: number[]) => void
  onDataRangeChange: (menuId: number, dataRange: DataRange) => void
  onCheckAll: () => void
  onClearAll: () => void
  onSave: () => void
  loadApiBindings: (menuId: number) => Promise<MenuResourceDto[]>
}

interface TreeNodeExtra {
  origin: PermissionDto
}

type PermissionTreeNode = DataNode & { extra?: TreeNodeExtra }

function toTreeNodes(list: PermissionDto[]): PermissionTreeNode[] {
  return list
    .slice()
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .map((p) => {
      const childrenMenus = p.children?.length ? toTreeNodes(p.children) : []
      const operationNodes: PermissionTreeNode[] = (p.operations ?? [])
        .slice()
        .sort((a, b) => a.menuOrder - b.menuOrder)
        .map((op) => ({
          key: op.menuId,
          title: op.menuName,
          extra: { origin: op },
        }))

      const allChildren = [...childrenMenus, ...operationNodes]
      return {
        key: p.menuId,
        title: p.menuName,
        children: allChildren.length ? allChildren : undefined,
        extra: { origin: p },
      }
    })
}

function collectAllKeys(nodes: PermissionTreeNode[]): React.Key[] {
  const keys: React.Key[] = []
  const walk = (list: PermissionTreeNode[]) => {
    for (const n of list) {
      keys.push(n.key)
      if (n.children?.length) walk(n.children as PermissionTreeNode[])
    }
  }
  walk(nodes)
  return keys
}

export function PermissionTree({
  platformLabel,
  platformColor,
  roleName,
  isSystemRole,
  loading,
  saving,
  permissionTree,
  checkedKeys,
  dataRangeMap,
  expandedApiBindings,
  onCheckChange,
  onDataRangeChange,
  onCheckAll,
  onClearAll,
  onSave,
  loadApiBindings,
}: PermissionTreeProps) {
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [loadingApiMenuId, setLoadingApiMenuId] = useState<number | null>(null)
  const [apiDrawerMenu, setApiDrawerMenu] = useState<{ menuId: number; menuName: string } | null>(
    null,
  )
  const [apiDrawerOpen, setApiDrawerOpen] = useState(false)

  useEffect(() => {
    setExpandedKeys([])
    setLoadingApiMenuId(null)
    setApiDrawerMenu(null)
    setApiDrawerOpen(false)
  }, [permissionTree])

  const treeNodes: PermissionTreeNode[] = useMemo(
    () => (permissionTree?.length ? toTreeNodes(permissionTree) : []),
    [permissionTree],
  )

  const allTreeKeys = useMemo(() => collectAllKeys(treeNodes), [treeNodes])

  // treeData 只负责结构（disabled），不嵌入 title JSX，
  // title 统一通过 Tree 的 titleRender 渲染，保证勾选/DataRange 变化时无需重建整棵树
  const treeData = useMemo(
    () => buildTreeStructure(treeNodes, isSystemRole),
    [treeNodes, isSystemRole],
  )

  const handleCheck = (
    checked:
      | React.Key[]
      | { checked: React.Key[]; halfChecked: React.Key[] },
    info: { halfCheckedKeys?: React.Key[] },
  ) => {
    if (isSystemRole) return
    const checkedArr = Array.isArray(checked) ? checked : checked.checked
    onCheckChange(checkedArr as number[], (info.halfCheckedKeys ?? []) as number[])
  }

  const openApiDrawer = async (menuId: number, menuName: string) => {
    setApiDrawerMenu({ menuId, menuName })
    setApiDrawerOpen(true)
    if (!expandedApiBindings[menuId] && loadingApiMenuId !== menuId) {
      setLoadingApiMenuId(menuId)
      await loadApiBindings(menuId)
      setLoadingApiMenuId(null)
    }
  }

  const renderApiBindings = (menuId: number) => {
    const list = expandedApiBindings[menuId]
    if (loadingApiMenuId === menuId) {
      return <div style={{ padding: '6px 12px' }}><Spin size="small" /></div>
    }
    if (!list?.length) {
      return (
        <div style={{ padding: '6px 12px', color: 'var(--ant-color-text-tertiary)' }}>
          暂无绑定的 API 资源，需在菜单管理中配置
        </div>
      )
    }
    const flat: MenuResourceDto[] = []
    const walk = (items: MenuResourceDto[]) => {
      for (const it of items) {
        if (it.operations?.length) walk(it.operations)
        else flat.push(it)
      }
    }
    walk(list)
    return (
      <Space direction="vertical" size={4} style={{ padding: '6px 12px', width: '100%' }}>
        {flat.map((api) => (
          <Space key={api.id} size={8} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Space size={6}>
              <Tag color={api.isChecked ? 'success' : 'default'} style={{ minWidth: 56, textAlign: 'center' }}>
                {api.isChecked ? '已绑定' : '未绑定'}
              </Tag>
              <span style={{ fontFamily: 'monospace' }}>{api.routePattern}</span>
            </Space>
            <span style={{ color: 'var(--ant-color-text-tertiary)' }}>{api.name}</span>
          </Space>
        ))}
      </Space>
    )
  }

  // titleRender：用 useCallback 稳定引用，只在依赖项实际变化时重建，
  // 避免每次父组件 re-render 都给 Tree 传入新函数引用。
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderNodeTitle = useCallback((nodeData: DataNode) => {
    const origin = (nodeData as PermissionTreeNode).extra?.origin
    if (!origin) return <span>{nodeData.title as string}</span>

    const isOperation = origin.menuType === MenuType.Operation
    const isMenu = origin.menuType === MenuType.Menu
    const isChecked = checkedKeys.includes(origin.menuId)
    // DataRange Select 仅对 Menu / Operation 节点、在勾选且非系统角色时显示
    const showDataRange = (isMenu || isOperation) && isChecked && !isSystemRole

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <Space size={6} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{origin.menuName}</span>
          <Space size={4}>
            {showDataRange && (
              <Select
                size="small"
                value={dataRangeMap[origin.menuId] ?? DataRange.All}
                style={{ width: 108 }}
                popupMatchSelectWidth={false}
                options={DATA_RANGE_OPTIONS}
                onClick={(e) => e.stopPropagation()}
                onChange={(val) => onDataRangeChange(origin.menuId, val)}
              />
            )}
            {isOperation && (
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 4 }}
                onClick={(e) => {
                  e.stopPropagation()
                  void openApiDrawer(origin.menuId, origin.menuName)
                }}
              >
                查看 API 绑定
              </Button>
            )}
          </Space>
        </Space>
      </div>
    )
  // useCallback deps：覆盖 renderNodeTitle 直接读取的响应式值。
  // toggleApiExpand / renderApiBindings 是组件内部函数，不直接列入 deps，
  // 但它们的所有依赖项（apiExpandedMenuIds、expandedApiBindings、loadingApiMenuId）
  // 都已包含在此列表中，故闭包始终与最新状态一致，eslint-disable 屏蔽此保守警告。
  // loadApiBindings 是稳定 prop（调用方应保证引用稳定），不加入 deps 以避免冗余重建。
  }, [loadingApiMenuId, checkedKeys, dataRangeMap, isSystemRole, expandedApiBindings, onDataRangeChange])

  if (!permissionTree.length && !loading) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="该平台暂无菜单，请先在菜单管理中添加" />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Space
        style={{
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ marginRight: 16 }}>
            配置角色：<strong>{roleName ?? '—'}</strong>
          </span>
          <span>
            平台：<Tag color={platformColor}>{platformLabel}</Tag>
          </span>
        </div>
        <Space>
          <Button size="small" icon={<ExpandAltOutlined />} onClick={() => setExpandedKeys(allTreeKeys)}>
            展开全部
          </Button>
          <Button size="small" icon={<ShrinkOutlined />} onClick={() => setExpandedKeys([])}>
            收起全部
          </Button>
          <Button
            size="small"
            icon={<CheckOutlined />}
            disabled={isSystemRole || !permissionTree.length}
            onClick={onCheckAll}
          >
            全选
          </Button>
          <Popconfirm
            title="清空所有权限"
            description="确定要清空当前角色在该平台下的所有权限吗？"
            onConfirm={onClearAll}
            disabled={isSystemRole}
          >
            <Button size="small" icon={<DeleteOutlined />} disabled={isSystemRole}>
              清空
            </Button>
          </Popconfirm>
          {!isSystemRole && (
            <Button
              type="primary"
              loading={saving}
              disabled={!permissionTree.length}
              onClick={onSave}
            >
              保存权限
            </Button>
          )}
        </Space>
      </Space>

      {isSystemRole && (
        <Alert
          type="info"
          showIcon
          message="系统内置角色权限不可修改。当前为只读模式。"
          style={{ marginBottom: 12 }}
        />
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          border: '1px solid var(--ant-color-border-secondary)',
          borderRadius: 6,
          padding: 8,
          position: 'relative',
        }}
      >
        <Spin spinning={loading || saving}>
          <Tree
            checkable
            selectable={false}
            virtual
            treeData={treeData}
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            titleRender={renderNodeTitle}
            onExpand={(keys) => setExpandedKeys(keys)}
            onCheck={handleCheck as any}
          />
        </Spin>
      </div>

      {/* 查看 API 绑定抽屉，仅做只读查看，不修改绑定关系 */}
      <Drawer
        title={apiDrawerMenu ? `API 绑定 - ${apiDrawerMenu.menuName}` : 'API 绑定'}
        width={520}
        open={apiDrawerOpen && !!apiDrawerMenu}
        destroyOnClose
        onClose={() => {
          setApiDrawerOpen(false)
        }}
      >
        {apiDrawerMenu && renderApiBindings(apiDrawerMenu.menuId)}
      </Drawer>
    </div>
  )
}

// ─── 纯结构构建（不含 title JSX，由 titleRender 负责渲染） ────────────────────

function buildTreeStructure(
  nodes: PermissionTreeNode[],
  isSystemRole: boolean,
): PermissionTreeNode[] {
  return nodes.map((n) => {
    const children = n.children?.length
      ? buildTreeStructure(n.children as PermissionTreeNode[], isSystemRole)
      : undefined
    return {
      ...n,
      disabled: isSystemRole,
      children,
    }
  })
}

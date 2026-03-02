import { useState, useEffect, useRef } from 'react'
import {
  App,
  Alert,
  Button,
  Drawer,
  Empty,
  Radio,
  Space,
  Spin,
  Tree,
} from 'antd'
import { ExpandAltOutlined, ShrinkOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  RoleApi,
  PLATFORM_META,
  parsePlatformFlags,
  PlatformType,
} from '@/services/role'
import { ROLE_QUERY_KEYS } from './useRole'
import type { PermissionDto, RoleDto } from '@/services/role'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PermissionDrawerProps {
  open:    boolean
  role:    RoleDto | null
  onClose: () => void
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

/** 将 PermissionDto[] 递归转为 Ant Design Tree DataNode[]（operation 作为叶子节点） */
function toTreeNodes(list: PermissionDto[]): DataNode[] {
  return list
    .slice()
    .sort((a, b) => a.menuOrder - b.menuOrder)
    .map((p) => {
      const subChildren: DataNode[] = [
        ...(p.children?.length   ? toTreeNodes(p.children)   : []),
        ...(p.operations?.length ? toTreeNodes(p.operations) : []),
      ]
      return {
        key:      p.menuId,
        title:    p.menuName,
        children: subChildren.length ? subChildren : undefined,
      }
    })
}

/** 收集树中所有 node key（用于"展开全部"） */
function collectAllKeys(nodes: DataNode[]): React.Key[] {
  const keys: React.Key[] = []
  const walk = (list: DataNode[]) => {
    for (const n of list) {
      if (n.children?.length) {
        keys.push(n.key)
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return keys
}

/** 收集 hasPermission === true 的 menuId（初始 checkedKeys） */
function collectCheckedIds(list: PermissionDto[]): number[] {
  const ids: number[] = []
  const walk = (items: PermissionDto[]) => {
    for (const p of items) {
      if (p.hasPermission) ids.push(p.menuId)
      if (p.children)   walk(p.children)
      if (p.operations) walk(p.operations)
    }
  }
  walk(list)
  return ids
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissionDrawer({ open, role, onClose }: PermissionDrawerProps) {
  const { message, modal } = App.useApp()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─── 平台 Tab ──────────────────────────────────────────────────────────
  const availablePlatforms = role ? parsePlatformFlags(role.platforms) : []
  const [activePlatform, setActivePlatform] = useState<number>(
    availablePlatforms[0] ?? PlatformType.Admin,
  )

  // 打开时重置到第一个平台
  useEffect(() => {
    if (open && role) {
      const platforms = parsePlatformFlags(role.platforms)
      setActivePlatform(platforms[0] ?? PlatformType.Admin)
      setIsDirty(false)
      setErrorMsg(null)
    }
  }, [open, role])

  // ─── 权限树数据（角色未配置平台时不请求） ─────────────────────────────────
  const permQuery = useQuery({
    queryKey: ROLE_QUERY_KEYS.permission(role?.id ?? 0, activePlatform),
    queryFn:  () => RoleApi.getPermission(role!.id, activePlatform),
    enabled:  open && role != null && availablePlatforms.length > 0,
  })

  const treeNodes: DataNode[] = permQuery.data ? toTreeNodes(permQuery.data) : []

  // ─── 勾选状态 ─────────────────────────────────────────────────────────
  const [checkedKeys,     setCheckedKeys]     = useState<React.Key[]>([])
  const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([])
  const [isDirty,         setIsDirty]         = useState(false)
  const [expandedKeys,    setExpandedKeys]    = useState<React.Key[]>([])

  // 数据加载完成后初始化 checkedKeys 和展开状态
  const permDataRef = useRef<PermissionDto[] | undefined>(undefined)
  useEffect(() => {
    if (permQuery.data && permQuery.data !== permDataRef.current) {
      permDataRef.current = permQuery.data
      const ids = collectCheckedIds(permQuery.data)
      setCheckedKeys(ids)
      setHalfCheckedKeys([])
      setIsDirty(false)
      // 默认展开第一层
      setExpandedKeys(treeNodes.map((n) => n.key))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permQuery.data])

  const handleCheck = (
    checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
    info: { halfCheckedKeys?: React.Key[] },
  ) => {
    const checkedArr = Array.isArray(checked) ? checked : checked.checked
    setCheckedKeys(checkedArr)
    setHalfCheckedKeys(info.halfCheckedKeys ?? [])
    setIsDirty(true)
  }

  // ─── 平台切换（有未保存修改时二次确认） ──────────────────────────────
  const handlePlatformChange = (next: number) => {
    if (!isDirty) {
      setActivePlatform(next)
      return
    }
    modal.confirm({
      title:      '切换平台',
      content:    '切换平台将丢失当前未保存的修改，确认切换？',
      okText:     '确认切换',
      cancelText: '取消',
      onOk: () => {
        setIsDirty(false)
        setActivePlatform(next)
      },
    })
  }

  // ─── 展开 / 收起 ──────────────────────────────────────────────────────
  const handleExpandAll  = () => setExpandedKeys(collectAllKeys(treeNodes))
  const handleCollapseAll = () => setExpandedKeys([])

  // ─── 保存权限 ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () =>
      RoleApi.savePermission(role!.id, {
        roleId:       role!.id,
        platformType: activePlatform,
        menus: checkedKeys as number[],
      }),
    onSuccess: () => {
      message.success('权限配置保存成功')
      setIsDirty(false)
      setErrorMsg(null)
    },
    onError: (err: Error) => setErrorMsg(err.message ?? '保存失败'),
  })

  // ─── Render ───────────────────────────────────────────────────────────

  const platformTabs = availablePlatforms.map((p) => ({
    label: PLATFORM_META[p]?.label ?? `平台${p}`,
    value: p,
  }))

  return (
    <Drawer
      title={`配置权限：${role?.name ?? ''}`}
      width={600}
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
              disabled={availablePlatforms.length === 0}
              onClick={() => saveMutation.mutate()}
            >
              保存权限
            </Button>
          </Space>
        </div>
      }
    >
      {/* 平台 Tab */}
      {platformTabs.length > 1 && (
        <Radio.Group
          value={activePlatform}
          onChange={(e) => handlePlatformChange(e.target.value as number)}
          optionType="button"
          buttonStyle="solid"
          style={{ marginBottom: 12 }}
        >
          {platformTabs.map((p) => (
            <Radio.Button key={p.value} value={p.value}>
              {p.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}

      {/* 展开/收起 */}
      <Space style={{ marginBottom: 8 }}>
        <Button size="small" icon={<ExpandAltOutlined />} onClick={handleExpandAll}>
          展开全部
        </Button>
        <Button size="small" icon={<ShrinkOutlined />} onClick={handleCollapseAll}>
          收起全部
        </Button>
      </Space>

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

      {/* 权限树 */}
      <Spin spinning={permQuery.isLoading}>
        {availablePlatforms.length === 0 ? (
          <Empty description="该角色未配置所属平台，请先编辑角色选择平台" />
        ) : !permQuery.isLoading && treeNodes.length === 0 ? (
          <Empty description="该平台暂无菜单，请先在菜单管理中添加菜单" />
        ) : (
          <Tree
            checkable
            selectable={false}
            treeData={treeNodes}
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onCheck={handleCheck as (checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }, info: { halfCheckedKeys?: React.Key[] }) => void}
          />
        )}
      </Spin>
    </Drawer>
  )
}

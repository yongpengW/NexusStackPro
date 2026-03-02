import { useState, useRef, useEffect } from 'react'
import {
  Table,
  Button,
  Radio,
  Space,
  Tag,
  Tooltip,
  Dropdown,
} from 'antd'
import type { TableColumnsType, MenuProps } from 'antd'
import {
  PlusOutlined,
  DownOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import {
  MenuType,
  MenuTypeLabels,
  MenuIconType,
  PLATFORM_META,
  PlatformType,
} from '@/services/menu'
import type { MenuTreeDto, MenuDto } from '@/services/menu'
import { useMenu } from './useMenu'
import { MenuDrawer } from './MenuDrawer'
import { ResourceDrawer } from './ResourceDrawer'

const PLATFORM_TABS = [
  { value: PlatformType.All,     label: '全部' },
  { value: PlatformType.Admin,   label: '超管' },
  { value: PlatformType.Pc,      label: 'PC端' },
  { value: PlatformType.Mini,    label: '小程序' },
  { value: PlatformType.Android, label: 'App' },
]

function collectAllKeys(nodes: MenuTreeDto[]): number[] {
  const keys: number[] = []
  const walk = (list: MenuTreeDto[]) => {
    for (const node of list) {
      keys.push(node.id)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return keys
}

export default function MenuPage() {
  const [platformType, setPlatformType] = useState<number>(PlatformType.All)
  const platformTypeRef = useRef(platformType)
  useEffect(() => {
    platformTypeRef.current = platformType
  }, [platformType])

  const { dataSource, isLoading, operatingId, refresh, handleDelete } = useMenu(platformType)

  const [expandedKeys, setExpandedKeys] = useState<number[]>([])
  const initialExpandDone = useRef(false)
  useEffect(() => {
    if (initialExpandDone.current) return
    if (!isLoading && dataSource.length > 0) {
      setExpandedKeys(dataSource.map((n) => n.id))
      initialExpandDone.current = true
    }
  }, [isLoading, dataSource])

  const handleExpandAll = () => setExpandedKeys(collectAllKeys(dataSource))
  const handleCollapseAll = () => setExpandedKeys([])

  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [parentNode, setParentNode] = useState<MenuTreeDto | null>(null)
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false)
  const [resourceMenu, setResourceMenu] = useState<MenuDto | null>(null)

  const openAddRoot = () => {
    setEditId(null)
    setParentNode(null)
    setMenuDrawerOpen(true)
  }
  const openAddChild = (parent: MenuTreeDto) => {
    setEditId(null)
    setParentNode(parent)
    setMenuDrawerOpen(true)
  }
  const openEdit = (id: number) => {
    setEditId(id)
    setParentNode(null)
    setMenuDrawerOpen(true)
  }
  const openResourceDrawer = (record: MenuDto) => {
    setResourceMenu(record)
    setResourceDrawerOpen(true)
  }
  const closeMenuDrawer = () => setMenuDrawerOpen(false)
  const closeResourceDrawer = () => setResourceDrawerOpen(false)

  const columns: TableColumnsType<MenuDto> = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <span style={!record.isVisible ? { opacity: 0.5 } : undefined}>
          {text}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: number) => MenuTypeLabels[type as MenuType] ?? '—',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon: string, record) => {
        if (!icon) return '—'
        if (record.iconType === MenuIconType.Picture) {
          return <img src={icon} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
        }
        return <span title={icon}>{icon}</span>
      },
    },
    {
      title: '路由 URL',
      dataIndex: 'url',
      key: 'url',
      width: 160,
      ellipsis: true,
      render: (url: string, record) =>
        record.type === MenuType.Menu ? (url || '—') : '—',
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 70,
    },
    {
      title: '可见',
      dataIndex: 'isVisible',
      key: 'isVisible',
      width: 60,
      render: (v: boolean) =>
        v ? <CheckOutlined style={{ color: 'var(--ant-color-success)' }} /> : <CloseOutlined style={{ color: 'var(--ant-color-text-tertiary)' }} />,
    },
    {
      title: '平台',
      dataIndex: 'platformType',
      key: 'platformType',
      width: 90,
      render: (p: number) => {
        const meta = PLATFORM_META[p]
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : '—'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => {
        const treeRecord = record as MenuTreeDto
        const hasChildren = !!(treeRecord.children?.length)
        const isOperation = record.type === MenuType.Operation
        const isOperating = operatingId === record.id

        const moreItems: MenuProps['items'] = [
          hasChildren
            ? {
                key: 'delete',
                label: (
                  <Tooltip title="请先删除子级菜单">
                    <span style={{ pointerEvents: 'all', cursor: 'not-allowed' }}>删除</span>
                  </Tooltip>
                ),
                disabled: true,
              }
            : {
                key: 'delete',
                label: '删除',
                danger: true,
                onClick: () => handleDelete(record),
              },
        ]

        return (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => openEdit(record.id)}>
              编辑
            </Button>
            {!isOperation && (
              <Button type="link" size="small" onClick={() => openAddChild(treeRecord)}>
                新增子项
              </Button>
            )}
            {isOperation && (
              <Button type="link" size="small" onClick={() => openResourceDrawer(record)}>
                绑定接口
              </Button>
            )}
            <Dropdown menu={{ items: moreItems }} trigger={['click']} placement="bottomRight">
              <Button
                type="link"
                size="small"
                loading={isOperating}
                icon={<DownOutlined />}
              >
                更多
              </Button>
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  return (
    <PageContainer
      title="菜单管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddRoot}>
          新增根菜单
        </Button>
      }
    >
      <Radio.Group
        value={platformType}
        onChange={(e) => setPlatformType(e.target.value as number)}
        optionType="button"
        buttonStyle="solid"
        style={{ marginBottom: 16 }}
      >
        {PLATFORM_TABS.map((t) => (
          <Radio.Button key={t.value} value={t.value}>
            {t.label}
          </Radio.Button>
        ))}
      </Radio.Group>

      <Space style={{ marginBottom: 16 }}>
        <Button size="small" icon={<ExpandAltOutlined />} onClick={handleExpandAll}>
          展开全部
        </Button>
        <Button size="small" icon={<ShrinkOutlined />} onClick={handleCollapseAll}>
          收起全部
        </Button>
      </Space>

      <Table<MenuDto>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={dataSource}
        loading={isLoading}
        pagination={false}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys(keys as number[]),
        }}
        onRow={(record) => ({
          style: !record.isVisible ? { opacity: 0.55 } : undefined,
        })}
        locale={{ emptyText: '暂无菜单数据，点击右上角「新增根菜单」' }}
      />

      <MenuDrawer
        open={menuDrawerOpen}
        editId={editId}
        parentNode={parentNode}
        treeData={dataSource}
        platformType={platformType}
        onClose={() => { closeMenuDrawer(); refresh() }}
        onSuccess={() => { closeMenuDrawer(); refresh() }}
      />

      <ResourceDrawer
        open={resourceDrawerOpen}
        menu={resourceMenu}
        onClose={() => { closeResourceDrawer(); refresh() }}
      />
    </PageContainer>
  )
}

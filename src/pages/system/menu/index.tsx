import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Button,
  Radio,
  Space,
  Tag,
  Tooltip,
  Dropdown,
  Tree,
  Card,
  Input,
} from 'antd'
import type { MenuProps } from 'antd'
import type { DataNode, TreeProps } from 'antd/es/tree'
import {
  PlusOutlined,
  DownOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  ReloadOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
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

type MenuTreeNode = DataNode & { nodeData?: MenuTreeDto }

function toTreeData(nodes: MenuTreeDto[]): MenuTreeNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: n.name,
    nodeData: n,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))
}

function flattenMenus(nodes: MenuTreeDto[]): MenuDto[] {
  const list: MenuDto[] = []
  const walk = (arr: MenuTreeDto[]) => {
    arr.forEach((n) => {
      list.push(n)
      if (n.children?.length) walk(n.children)
    })
  }
  walk(nodes)
  return list
}

export default function MenuPage() {
  const [platformType, setPlatformType] = useState<number>(PlatformType.All)

  const { dataSource, isLoading, operatingId, refresh, handleDelete } = useMenu(platformType)

  const [keyword, setKeyword] = useState('')
  const [inputValue, setInputValue] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSearch = (value: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => setKeyword(value.trim()), 300)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    triggerSearch(v)
  }

  const handleReset = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setInputValue('')
    setKeyword('')
  }

  const [expandedKeys, setExpandedKeys] = useState<number[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)
  const initialExpandDone = useRef(false)
  useEffect(() => {
    if (initialExpandDone.current) return
    if (!isLoading && dataSource.length > 0) {
      setExpandedKeys(dataSource.map((n) => n.id))
      setSelectedMenuId((prev) => prev ?? dataSource[0].id)
      initialExpandDone.current = true
    }
  }, [isLoading, dataSource])

  const handleExpandAll = () => setExpandedKeys(collectAllKeys(dataSource))
  const handleCollapseAll = () => setExpandedKeys([])

  const handleTreeSelect: TreeProps['onSelect'] = (_keys, info) => {
    if (info.selected) {
      setSelectedMenuId(info.node.key as number)
    }
  }

  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [parentNode, setParentNode] = useState<MenuTreeDto | null>(null)
  const [resourceDrawerOpen, setResourceDrawerOpen] = useState(false)
  const [resourceMenu, setResourceMenu] = useState<MenuDto | null>(null)

  const allMenus = useMemo(() => flattenMenus(dataSource), [dataSource])
  const filteredMenus = useMemo(
    () => {
      const kw = keyword.trim().toLowerCase()
      if (kw) {
        return allMenus.filter((m) => {
          const nameHit = m.name?.toLowerCase().includes(kw)
          const codeHit = m.code?.toLowerCase().includes(kw)
          const urlHit = m.url?.toLowerCase().includes(kw)
          return !!(nameHit || codeHit || urlHit)
        })
      }

      return selectedMenuId
        ? allMenus.filter((m) => m.parentId === selectedMenuId)
        : allMenus
    },
    [allMenus, selectedMenuId, keyword],
  )

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

  const columns: ProColumns<MenuDto>[] = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      ellipsis: true,
      render: (_, record) => (
        <span style={!record.isVisible ? { opacity: 0.5 } : undefined}>
          {record.name}
        </span>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (_, record) => MenuTypeLabels[record.type as MenuType] ?? '—',
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 120,
      render: (_, record) => {
        const icon = record.icon
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
      width: 220,
      ellipsis: true,
      render: (_, record) =>
        record.type === MenuType.Menu ? (record.url || '—') : '—',
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
      render: (_, record) => {
        if (record.type === MenuType.Operation) {
          return '—'
        }
        return record.isVisible ? (
          <CheckOutlined style={{ color: '#52c41a' }} />
        ) : (
          <CloseOutlined style={{ color: '#ff4d4f' }} />
        )
      },
    },
    {
      title: '平台',
      dataIndex: 'platformType',
      key: 'platformType',
      width: 90,
      render: (_, record) => {
        const meta = PLATFORM_META[record.platformType]
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
    <PageContainer title="菜单管理">
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

      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        {/* 左侧菜单树 */}
        <div style={{ width: 260, minWidth: 220 }}>
          <Card
            title="菜单层级"
            size="small"
            styles={{ body: { padding: 8, maxHeight: 520, overflow: 'auto' } }}
            extra={
              <Space size={4}>
                <Button
                  type="link"
                  size="small"
                  icon={<ExpandAltOutlined />}
                  onClick={handleExpandAll}
                >
                  展开
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<ShrinkOutlined />}
                  onClick={handleCollapseAll}
                >
                  收起
                </Button>
              </Space>
            }
          >
            <Tree
              showLine={{ showLeafIcon: false }}
              treeData={toTreeData(dataSource)}
              expandedKeys={expandedKeys}
              selectedKeys={selectedMenuId ? [selectedMenuId] : []}
              onExpand={(keys) => setExpandedKeys(keys as number[])}
              onSelect={handleTreeSelect}
              titleRender={(node) => {
                const menuNode = node as MenuTreeNode
                const menu = menuNode.nodeData
                if (!menu) return <span>{node.title as string}</span>

                const hasChildren = !!menu.children?.length
                const isOperation = menu.type === MenuType.Operation

                const menuItems: MenuProps['items'] = [
                  !isOperation && {
                    key: 'addChild',
                    label: '新增子项',
                    icon: <PlusOutlined />,
                    onClick: () => openAddChild(menu),
                  },
                  isOperation && {
                    key: 'bind',
                    label: '绑定接口',
                    onClick: () => openResourceDrawer(menu),
                  },
                  {
                    key: 'edit',
                    label: '编辑',
                    icon: <DownOutlined rotate={180} />,
                    onClick: () => openEdit(menu.id),
                  },
                  {
                    key: 'delete',
                    label: hasChildren ? (
                      <Tooltip title="请先删除子级菜单">
                        <span style={{ pointerEvents: 'all', cursor: 'not-allowed' }}>
                          删除
                        </span>
                      </Tooltip>
                    ) : (
                      '删除'
                    ),
                    icon: <MinusOutlined />,
                    danger: true,
                    disabled: hasChildren,
                    onClick: () => {
                      if (!hasChildren) {
                        handleDelete(menu)
                      }
                    },
                  },
                ].filter(Boolean)

                return (
                  <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '100%',
                        opacity: menu.isVisible ? 1 : 0.55,
                      }}
                    >
                      {menu.name}
                    </span>
                  </Dropdown>
                )
              }}
            />
          </Card>
        </div>

        {/* 右侧列表 */}
        <div style={{ flex: 1 }}>
          {/* 搜索栏 */}
          <Space style={{ marginBottom: 16 }}>
            <Input
              allowClear
              placeholder="搜索名称 / 编码"
              value={inputValue}
              onChange={handleInputChange}
              onPressEnter={() => {
                if (debounceTimer.current) clearTimeout(debounceTimer.current)
                setKeyword(inputValue.trim())
              }}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 260 }}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => {
                if (debounceTimer.current) clearTimeout(debounceTimer.current)
                setKeyword(inputValue.trim())
              }}
            >
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>

          <ProTable<MenuDto>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={filteredMenus}
            loading={isLoading}
            search={false}
            options={false}
            headerTitle="菜单列表"
            toolBarRender={() => [
              <Button
                key="add-root"
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddRoot}
              >
                新增根菜单
              </Button>,
            ]}
            pagination={false}
            onRow={(record) => ({
              style: !record.isVisible ? { opacity: 0.55 } : undefined,
            })}
            locale={{ emptyText: '暂无菜单数据，点击上方「新增根菜单」' }}
          />
        </div>
      </div>

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

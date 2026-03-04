import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Button,
  Input,
  Tag,
  Space,
  Dropdown,
  Tooltip,
  Tree,
  Card,
} from 'antd'
import type { MenuProps } from 'antd'
import type { DataNode, TreeProps } from 'antd/es/tree'
import {
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
} from '@ant-design/icons'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { RegionLevel, RegionLevelLabels } from '@/services/region'
import type { RegionTreeDto, RegionDto } from '@/services/region'
import { useRegion } from './useRegion'
import { RegionDrawer } from './RegionDrawer'

// ─── 树节点展开工具 ───────────────────────────────────────────────────────────

function collectAllKeys(nodes: RegionTreeDto[]): number[] {
  const keys: number[] = []
  const walk = (list: RegionTreeDto[]) => {
    for (const node of list) {
      keys.push(node.id)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return keys
}

// ─── 将后端 RegionTreeDto 转为 antd Tree 需要的 DataNode ──────────────────────

type RegionTreeNode = DataNode & { nodeData?: RegionTreeDto }

function toTreeData(nodes: RegionTreeDto[]): RegionTreeNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: n.name,
    nodeData: n,
    children: n.children?.length ? toTreeData(n.children) : undefined,
  }))
}

// ─── 拍平整棵树并按 id 去重 ────────────────────────────────────────────────────

function flattenRegionsUnique(nodes: RegionTreeDto[]): RegionDto[] {
  // 以 parentId + name + code + level 作为逻辑唯一键，防止同一节点被重复渲染
  const map = new Map<string, RegionDto>()
  const walk = (list: RegionTreeDto[]) => {
    list.forEach((n) => {
      const key = `${n.parentId ?? 0}__${n.name ?? ''}__${n.code ?? ''}__${n.level}`
      if (!map.has(key)) map.set(key, n)
      if (n.children?.length) walk(n.children)
    })
  }
  walk(nodes)
  return Array.from(map.values())
}

// ─── 搜索高亮 ────────────────────────────────────────────────────────────────

function highlight(text: string, keyword: string): React.ReactNode {
  if (!keyword || !text) return text
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ padding: 0, background: '#ffe58f' }}>
        {text.slice(idx, idx + keyword.length)}
      </mark>
      {text.slice(idx + keyword.length)}
    </>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function RegionPage() {
  // ── 数据 & 操作逻辑 ─────────────────────────────────────────────────────
  const {
    keyword,
    setKeyword,
    isLoading,
    treeData,
    operatingId,
    refresh,
    handleEnable,
    handleDisable,
    handleDelete,
  } = useRegion()

  // ── 搜索框受控值（独立于 keyword，300ms 防抖后才触发请求） ──────────────
  const [inputValue, setInputValue] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => setKeyword(value.trim()), 300)
    },
    [setKeyword],
  )

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

  // ── 左侧树形区域展开 & 选择 ──────────────────────────────────────────────
  const [expandedKeys, setExpandedKeys] = useState<number[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const initialTreeMounted = useRef(false)

  // 首次加载时，默认展开一级节点并选中第一个
  useEffect(() => {
    if (initialTreeMounted.current) return
    if (!isLoading && treeData.length > 0) {
      const rootIds = treeData.map((n) => n.id)
      setExpandedKeys(rootIds)
      setSelectedRegionId((prev) => prev ?? treeData[0].id)
      initialTreeMounted.current = true
    }
  }, [isLoading, treeData])

  const handleExpandAll = () => {
    setExpandedKeys(collectAllKeys(treeData))
  }
  const handleCollapseAll = () => setExpandedKeys([])

  const handleTreeSelect: TreeProps['onSelect'] = (_keys, info) => {
    // 避免重复点击同一节点时将选中状态清空（selected=false）导致右侧列表回退到“全部”
    if (info.selected) {
      setSelectedRegionId(info.node.key as number)
    }
  }

  // ── 前端分页（列表/树通用） ─────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 扁平化后的全量区域列表（按逻辑键去重），供列表与操作判断复用
  const allRegions = useMemo(() => flattenRegionsUnique(treeData), [treeData])

  const filteredData: RegionDto[] = useMemo(() => {
    const kw = keyword.trim().toLowerCase()

    // 有关键字时：在扁平数据里本地搜索（名称 / 简称 / Code）
    if (kw) {
      return allRegions.filter((n) => {
        const nameHit = n.name?.toLowerCase().includes(kw)
        const shortHit = n.shortName?.toLowerCase().includes(kw)
        const codeHit = n.code?.toLowerCase().includes(kw)
        return !!(nameHit || shortHit || codeHit)
      })
    }

    // 无关键字 & 未选中：展示全部
    if (!selectedRegionId) {
      return allRegions
    }

    // 无关键字 & 选中某节点：只展示其直系子节点
    return allRegions.filter((item) => item.parentId === selectedRegionId)
  }, [keyword, selectedRegionId, allRegions])

  // 关键词或数据源变化时重置到第一页
  useEffect(() => {
    setPage(1)
  }, [keyword, filteredData.length])

  // 当前页超出范围时（如切换每页条数后）回退到第一页，避免空白
  useEffect(() => {
    if (filteredData.length > 0 && (page - 1) * pageSize >= filteredData.length) {
      setPage(1)
    }
  }, [filteredData.length, page, pageSize])

  const pagedData = useMemo(() => {
    if (!filteredData?.length) return []
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  // ── Drawer 状态 ─────────────────────────────────────────────────────────
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [editId,      setEditId]      = useState<number | null>(null)
  const [parentNode,  setParentNode]  = useState<RegionTreeDto | null>(null)

  const openAddRoot = () => {
    setEditId(null)
    setParentNode(null)
    setDrawerOpen(true)
  }
  const openAddChild = (parent: RegionTreeDto) => {
    setEditId(null)
    setParentNode(parent)
    setDrawerOpen(true)
  }
  const openEdit = (id: number) => {
    setEditId(id)
    setParentNode(null)
    setDrawerOpen(true)
  }
  const closeDrawer = () => setDrawerOpen(false)

  // ── 列定义 ──────────────────────────────────────────────────────────────
  const columns: ProColumns<RegionDto>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <span style={!record.isEnable ? { opacity: 0.45 } : undefined}>
          {highlight(record.name, keyword)}
        </span>
      ),
    },
    {
      title: '简称',
      dataIndex: 'shortName',
      key: 'shortName',
      render: (_, record) => highlight(record.shortName, keyword) || '—',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (_, record) => highlight(record.code, keyword),
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (_, record) => RegionLevelLabels[record.level as RegionLevel] ?? '—',
    },
    {
      title: '排序',
      dataIndex: 'order',
      key: 'order',
      width: 70,
    },
    {
      title: '状态',
      dataIndex: 'isEnable',
      key: 'isEnable',
      width: 80,
      render: (_, record) => (
        <Tag color={record.isEnable ? 'success' : 'default'}>
          {record.isEnable ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const treeRecord = record as RegionTreeDto
        // 是否存在子级：统一基于扁平化后的 allRegions 判断，避免搜索/过滤状态导致判断不一致
        const hasChildren = allRegions.some((r) => r.parentId === record.id)
        const isOperating = operatingId === record.id

        const moreItems: MenuProps['items'] = [
          record.isEnable
            ? {
                key: 'disable',
                label: '禁用',
                danger: true,
                onClick: () => handleDisable(record),
              }
            : {
                key: 'enable',
                label: '启用',
                onClick: () => handleEnable(record.id),
              },
          { type: 'divider' },
          hasChildren
            ? {
                key: 'delete',
                // disabled 会给 MenuItem 加 pointer-events:none，需要在子元素上恢复
                label: (
                  <Tooltip title="请先删除子级区域">
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
            <Button
              type="link"
              size="small"
              onClick={() => openEdit(record.id)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              onClick={() => openAddChild(treeRecord)}
            >
              新增子级
            </Button>
            <Dropdown
              menu={{ items: moreItems }}
              trigger={['click']}
              placement="bottomRight"
            >
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <PageContainer title="区域管理">
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        {/* 左侧层级树 */}
        <div style={{ width: 260, minWidth: 220 }}>
          <Card
            title="区域层级"
            size="small"
            styles={{ body: { padding: 8, maxHeight: 520, overflow: 'auto' } }}
            extra={
              !keyword && (
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
              )
            }
          >
            <Tree
              showLine={{ showLeafIcon: false }}
              treeData={toTreeData(treeData)}
              expandedKeys={expandedKeys}
              selectedKeys={selectedRegionId ? [selectedRegionId] : []}
              onExpand={(keys) => setExpandedKeys(keys as number[])}
              onSelect={handleTreeSelect}
              titleRender={(node) => {
                const regionNode = node as RegionTreeNode
                const region = regionNode.nodeData
                if (!region) return <span>{node.title as string}</span>

                const hasChildren = !!region.children?.length
                const menuItems: MenuProps['items'] = [
                  {
                    key: 'addChild',
                    label: '新增子级',
                    icon: <PlusOutlined />,
                    onClick: () => openAddChild(region),
                  },
                  {
                    key: 'edit',
                    label: '编辑',
                    icon: <DownOutlined rotate={180} />, // 复用图标，避免额外引入
                    onClick: () => openEdit(region.id),
                  },
                  {
                    key: 'delete',
                    label: hasChildren ? (
                      <Tooltip title="请先删除子级区域">
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
                        handleDelete(region)
                      }
                    },
                  },
                ]

                return (
                  <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                    <span style={{ display: 'inline-block', width: '100%' }}>
                      {region.name}
                    </span>
                  </Dropdown>
                )
              }}
            />
          </Card>
        </div>

        {/* 右侧列表区 */}
        <div style={{ flex: 1 }}>
          {/* 搜索栏 */}
          <Space style={{ marginBottom: 16 }}>
            <Input
              allowClear
              placeholder="搜索名称 / 简称 / Code"
              value={inputValue}
              onChange={handleInputChange}
              onPressEnter={() => {
                if (debounceTimer.current) clearTimeout(debounceTimer.current)
                setKeyword(inputValue.trim())
              }}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: 240 }}
              onClear={handleReset}
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

          <ProTable<RegionDto>
            rowKey="id"
            size="middle"
            columns={columns}
            dataSource={pagedData as RegionDto[]}
            loading={isLoading}
            search={false}
            options={false}
            headerTitle="区域列表"
            toolBarRender={() => [
              <Button
                key="add-root"
                type="primary"
                icon={<PlusOutlined />}
                onClick={openAddRoot}
              >
                新增根节点
              </Button>,
            ]}
            pagination={{
              current: page,
              pageSize,
              total: filteredData.length,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (current, size) => {
                setPage(current)
                setPageSize(size)
              },
            }}
            onRow={(record) => ({
              style: !record.isEnable ? { opacity: 0.5 } : undefined,
            })}
            locale={{
              emptyText: keyword
                ? '未找到匹配的区域，请更换关键词'
                : '暂无区域数据，点击上方「新增根节点」',
            }}
          />
        </div>
      </div>

      {/* 新增 / 编辑 Drawer */}
      <RegionDrawer
        open={drawerOpen}
        editId={editId}
        parentNode={parentNode}
        onClose={() => { closeDrawer(); refresh() }}
        onSuccess={() => { closeDrawer(); refresh() }}
      />
    </PageContainer>
  )
}

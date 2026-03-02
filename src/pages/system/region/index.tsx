import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Dropdown,
  Tooltip,
} from 'antd'
import type { TableColumnsType, MenuProps } from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
} from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
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
    dataSource,
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

  // ── 展开/收起全部 ────────────────────────────────────────────────────────
  const [expandedKeys, setExpandedKeys] = useState<number[]>([])
  // 使用 ref 标记是否已完成首次默认展开，避免 render 阶段副作用
  const initialExpandDone = useRef(false)

  useEffect(() => {
    if (initialExpandDone.current) return
    if (!isLoading && !keyword && dataSource.length > 0) {
      setExpandedKeys((dataSource as RegionTreeDto[]).map((n) => n.id))
      initialExpandDone.current = true
    }
  }, [isLoading, keyword, dataSource])

  const handleExpandAll = () => {
    setExpandedKeys(collectAllKeys(dataSource as RegionTreeDto[]))
  }
  const handleCollapseAll = () => setExpandedKeys([])

  // ── 前端分页（列表/树通用） ─────────────────────────────────────────────
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // 关键词或数据源变化时重置到第一页
  useEffect(() => {
    setPage(1)
  }, [keyword, dataSource.length])

  // 当前页超出范围时（如切换每页条数后）回退到第一页，避免空白
  useEffect(() => {
    if (dataSource.length > 0 && (page - 1) * pageSize >= dataSource.length) {
      setPage(1)
    }
  }, [dataSource.length, page, pageSize])

  const pagedData = useMemo(() => {
    if (!dataSource?.length) return []
    const start = (page - 1) * pageSize
    return (dataSource as RegionDto[]).slice(start, start + pageSize)
  }, [dataSource, page, pageSize])

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
  const columns: TableColumnsType<RegionDto> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <span style={!record.isEnable ? { opacity: 0.45 } : undefined}>
          {highlight(text, keyword)}
        </span>
      ),
    },
    {
      title: '简称',
      dataIndex: 'shortName',
      key: 'shortName',
      render: (text: string) => highlight(text, keyword) || '—',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => highlight(text, keyword),
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level: number) => RegionLevelLabels[level as RegionLevel] ?? '—',
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
      render: (isEnable: boolean) => (
        <Tag color={isEnable ? 'success' : 'default'}>
          {isEnable ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const treeRecord = record as RegionTreeDto
        // 树形模式：用 children 长度判断；搜索扁平模式：检查列表中是否有节点以当前行为父级
        const hasChildren = keyword
          ? (dataSource as RegionDto[]).some((r) => r.parentId === record.id)
          : !!(treeRecord.children?.length)
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
    <PageContainer
      title="区域管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddRoot}>
          新增根节点
        </Button>
      }
    >
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
        {/* 展开/收起仅在树形视图下显示 */}
        {!keyword && (
          <>
            <Button
              size="small"
              icon={<ExpandAltOutlined />}
              onClick={handleExpandAll}
            >
              展开全部
            </Button>
            <Button
              size="small"
              icon={<ShrinkOutlined />}
              onClick={handleCollapseAll}
            >
              收起全部
            </Button>
          </>
        )}
      </Space>

      {/* 树形表格 */}
      <Table<RegionDto>
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={pagedData as RegionDto[]}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: dataSource.length,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (current, size) => {
            setPage(current)
            setPageSize(size)
          },
        }}
        expandable={
          keyword
            ? undefined
            : {
                expandedRowKeys: expandedKeys,
                onExpandedRowsChange: (keys) =>
                  setExpandedKeys(keys as number[]),
              }
        }
        onRow={(record) => ({
          style: !record.isEnable ? { opacity: 0.5 } : undefined,
        })}
        locale={{
          emptyText: keyword
            ? '未找到匹配的区域，请更换关键词'
            : '暂无区域数据，点击右上角"新增根节点"',
        }}
      />

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

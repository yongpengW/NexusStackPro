import { useMemo, useState } from 'react'
import { PageContainer } from '@ant-design/pro-components'
import { Card, Input, Tag, Space, Spin, Empty } from 'antd'
import {
  GlobalOutlined,
  EnvironmentOutlined,
  ApartmentOutlined,
  TeamOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Tree as OrgTree,
  TreeNode as OrgTreeNode,
} from 'react-organizational-chart'
import { useQuery } from '@tanstack/react-query'
import { RegionApi, RegionLevel, RegionLevelLabels, type RegionTreeDto } from '@/services/region'

function matchKeyword(node: RegionTreeDto, kw: string): boolean {
  const v = kw.toLowerCase()
  return (
    node.name?.toLowerCase().includes(v) ||
    node.shortName?.toLowerCase().includes(v) ||
    node.code?.toLowerCase().includes(v)
  )
}

function filterTree(nodes: RegionTreeDto[], kw: string): RegionTreeDto[] {
  if (!kw) return nodes
  const result: RegionTreeDto[] = []

  const dfs = (node: RegionTreeDto): RegionTreeDto | null => {
    const children: RegionTreeDto[] = []
    node.children?.forEach((c) => {
      const child = dfs(c)
      if (child) children.push(child)
    })

    const selfHit = matchKeyword(node, kw)
    if (selfHit || children.length) {
      return { ...node, children }
    }
    return null
  }

  nodes.forEach((n) => {
    const r = dfs(n)
    if (r) result.push(r)
  })

  return result
}

const levelColor: Record<RegionLevel, string> = {
  [RegionLevel.Country]: 'blue',
  [RegionLevel.Province]: 'green',
  [RegionLevel.City]: 'gold',
  [RegionLevel.Department]: 'purple',
}

function renderLevelIcon(level: RegionLevel) {
  switch (level) {
    case RegionLevel.Country:
      return <GlobalOutlined style={{ marginRight: 6, color: '#1677ff', fontSize: 16 }} />
    case RegionLevel.Province:
      return <ApartmentOutlined style={{ marginRight: 6, color: '#52c41a', fontSize: 16 }} />
    case RegionLevel.City:
      return <EnvironmentOutlined style={{ marginRight: 6, color: '#faad14', fontSize: 16 }} />
    case RegionLevel.Department:
    default:
      return <TeamOutlined style={{ marginRight: 6, color: '#722ed1', fontSize: 16 }} />
  }
}

// ─── 节点卡片 ───────────────────────────────────────────────────────────────────

const nodeCardStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: 8,
  background: '#fff',
  boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
  border: '1px solid #f0f0f0',
  maxWidth: 220,
}

function OrgNodeCard({ node }: { node: RegionTreeDto }) {
  return (
  <div style={nodeCardStyle}>
    {renderLevelIcon(node.level)}
    <span style={{ fontWeight: 500, marginRight: 8 }}>{node.name}</span>
    <Tag
      color={levelColor[node.level]}
      style={{ marginRight: 8, marginInlineEnd: 0 }}
    >
      {RegionLevelLabels[node.level]}
    </Tag>
    {node.code && (
      <Tag color="default" style={{ marginLeft: 8 }}>
        {node.code}
      </Tag>
    )}
  </div>
  )
}

function OrgSubTree({ node }: { node: RegionTreeDto }) {
  const hasChildren = node.children && node.children.length > 0
  return (
    <OrgTreeNode key={node.id} label={<OrgNodeCard node={node} />}>
      {hasChildren &&
        node.children!.map((child) => <OrgSubTree key={child.id} node={child} />)}
    </OrgTreeNode>
  )
}

function OrgPage() {
  const [keyword, setKeyword] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['system', 'org', 'region-tree'],
    queryFn: () => RegionApi.getTree({ includeChilds: true }),
  })

  const orgTree = useMemo(() => {
    const source = (data ?? []) as RegionTreeDto[]
    const filtered = filterTree(source, keyword.trim())
    return filtered
  }, [data, keyword])

  return (
    <PageContainer
      title="组织架构"
      subTitle="基于区域树自动生成的组织架构视图"
    >
      <Card
        variant="borderless"
        styles={{
          body: {
            padding: 16,
            minHeight: 520,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Space style={{ marginBottom: 16 }} align="center">
          <Input
            allowClear
            placeholder="搜索名称 / 简称 / Code"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Space size={8}>
            <Tag color={levelColor[RegionLevel.Country]}>{RegionLevelLabels[RegionLevel.Country]}</Tag>
            <Tag color={levelColor[RegionLevel.Province]}>{RegionLevelLabels[RegionLevel.Province]}</Tag>
            <Tag color={levelColor[RegionLevel.City]}>{RegionLevelLabels[RegionLevel.City]}</Tag>
            <Tag color={levelColor[RegionLevel.Department]}>
              {RegionLevelLabels[RegionLevel.Department]}
            </Tag>
          </Space>
        </Space>

        <div
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 8,
            background: '#fafafa',
            overflow: 'auto',
          }}
        >
          <Spin spinning={isLoading}>
            {orgTree.length === 0 ? (
              <Empty description="暂无组织数据" />
            ) : (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  padding: '24px 16px',
                  minHeight: 360,
                }}
              >
                <OrgTree
                  lineWidth="2px"
                  lineColor="#d9d9d9"
                  lineBorderRadius="12px"
                  label={
                    orgTree.length === 1 ? (
                      <OrgNodeCard node={orgTree[0]} />
                    ) : (
                      <div>
                        <Tag color={levelColor[RegionLevel.Country]}>
                          组织根节点
                        </Tag>
                      </div>
                    )
                  }
                >
                  {orgTree.length === 1
                    ? orgTree[0].children?.map((child) => (
                        <OrgSubTree key={child.id} node={child} />
                      ))
                    : orgTree.map((root) => <OrgSubTree key={root.id} node={root} />)}
                </OrgTree>
              </div>
            )}
          </Spin>
        </div>
      </Card>
    </PageContainer>
  )
}

export default OrgPage


import {
  AppstoreOutlined,
  FileTextOutlined,
  LikeOutlined,
  MessageOutlined,
  ProjectOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import {
  Avatar,
  Card,
  Col,
  Input,
  List,
  Row,
  Tag,
  Typography,
} from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const { Paragraph, Text } = Typography

// ─────────────────────────────────────────────
// Mock 数据
// ─────────────────────────────────────────────
const OWNERS = ['吴彦祖', '付小小', '林东东', '周星星', '曲丽丽']
const TAGS = ['前端', '后端', '设计', '运维', 'AI', '数据库', '移动端', '安全']
const AVATARS = [
  'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  'https://gw.alipayobjects.com/zos/rmsportal/cnrhVkzwxjPwAaCfPbdc.png',
  'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png',
  'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJE.png',
]

interface ArticleItem {
  id: string
  title: string
  description: string
  owner: string
  avatar: string
  updatedAt: string
  tags: string[]
  star: number
  like: number
  message: number
  type: string
  href: string
}

const mockArticles: ArticleItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  title: `Ant Design 系列文章 ${String(i + 1).padStart(2, '0')} - 组件设计与最佳实践`,
  description: `这篇文章主要介绍 Ant Design Pro 中某某组件的使用方法和最佳实践，包含了详细的 API 说明和代码示例，帮助开发者更好地理解和使用该组件。文章编号：${i + 1}。`,
  owner: OWNERS[i % 5],
  avatar: AVATARS[i % 5],
  updatedAt: new Date(Date.now() - i * 86400000).toLocaleDateString(),
  tags: [TAGS[i % TAGS.length], TAGS[(i + 1) % TAGS.length]],
  star: Math.floor(Math.random() * 200) + 10,
  like: Math.floor(Math.random() * 100) + 5,
  message: Math.floor(Math.random() * 50) + 1,
  type: 'article',
  href: '',
}))

const mockProjects: ArticleItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  title: `项目 ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'][i]}`,
  description: `这是一个${['企业级中台', '数据可视化', '移动端适配', '微服务架构', 'AI 赋能', '多端同步'][i]}类型的项目，旨在解决实际业务痛点，提升研发效率。`,
  owner: OWNERS[i % 5],
  avatar: AVATARS[i % 5],
  updatedAt: new Date(Date.now() - i * 7 * 86400000).toLocaleDateString(),
  tags: [TAGS[(i * 2) % TAGS.length]],
  star: Math.floor(Math.random() * 500) + 50,
  like: Math.floor(Math.random() * 300) + 20,
  message: Math.floor(Math.random() * 100) + 5,
  type: 'project',
  href: '',
}))

const mockApps: ArticleItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: ['监控大屏', '报表中心', '权限管理', '工单系统', '审批流程', '消息中心', '数据字典', '系统日志'][i],
  description: `这是一个${['实时监控展示', '多维度报表分析', 'RBAC 权限控制', '业务工单流转', '多级审批', '全局消息推送', '基础数据管理', '操作行为审计'][i]}应用，已上线运行。`,
  owner: OWNERS[i % 5],
  avatar: AVATARS[i % 5],
  updatedAt: new Date(Date.now() - i * 3 * 86400000).toLocaleDateString(),
  tags: [TAGS[(i + 2) % TAGS.length], TAGS[(i + 3) % TAGS.length]],
  star: Math.floor(Math.random() * 1000) + 100,
  like: Math.floor(Math.random() * 500) + 50,
  message: Math.floor(Math.random() * 200) + 10,
  type: 'app',
  href: '',
}))

// ─────────────────────────────────────────────
// 公共组件
// ─────────────────────────────────────────────
const IconText: React.FC<{ icon: React.ReactNode; text: React.ReactNode }> = ({ icon, text }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.45)' }}>
    {icon}
    {text}
  </span>
)

const ArticleListItem: React.FC<{ item: ArticleItem }> = ({ item }) => (
  <List.Item
    key={item.id}
    actions={[
      <IconText key="star" icon={<StarOutlined />} text={item.star} />,
      <IconText key="like" icon={<LikeOutlined />} text={item.like} />,
      <IconText key="msg" icon={<MessageOutlined />} text={item.message} />,
    ]}
    extra={
      item.type === 'app' ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 200 }}>
          {item.tags.map((tag) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
        </div>
      ) : null
    }
  >
    <List.Item.Meta
      avatar={<Avatar src={item.avatar} />}
      title={
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <a href={item.href || '#'}>{item.title}</a>
          {item.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      }
      description={
        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>
          {item.description}
        </Paragraph>
      }
    />
    <div style={{ display: 'flex', gap: 16, color: 'rgba(0,0,0,0.45)', fontSize: 13 }}>
      <span>
        <Avatar src={item.avatar} size={18} style={{ marginRight: 6 }} />
        {item.owner}
      </span>
      <span>更新于 {item.updatedAt}</span>
    </div>
  </List.Item>
)

// ─────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────
const tabMap = {
  articles: { label: '文章', icon: <FileTextOutlined />, data: mockArticles },
  projects: { label: '项目', icon: <ProjectOutlined />, data: mockProjects },
  applications: { label: '应用', icon: <AppstoreOutlined />, data: mockApps },
}

type TabKey = keyof typeof tabMap

const filterOptions = ['推荐', '前端', '后端', '数据库', 'AI', '移动端']
const owners = ['所有人', '吴彦祖', '付小小', '林东东', '周星星', '曲丽丽']

const SearchListPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('articles')
  const [searchText, setSearchText] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('推荐')
  const [selectedOwner, setSelectedOwner] = useState<string>('所有人')

  const { data } = tabMap[activeTab]
  const filteredData = data.filter((item) => {
    const matchSearch =
      !searchText || item.title.toLowerCase().includes(searchText.toLowerCase())
    const matchOwner = selectedOwner === '所有人' || item.owner === selectedOwner
    return matchSearch && matchOwner
  })

  return (
    <PageContainer
      title={t('menu.list.search-list')}
      content={
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Input.Search
            placeholder="请输入搜索内容"
            enterButton="搜索"
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v)}
            style={{ maxWidth: 522, width: '100%' }}
          />
        </div>
      }
      tabList={Object.entries(tabMap).map(([key, value]) => ({
        key,
        tab: value.label,
      }))}
      tabActiveKey={activeTab}
      onTabChange={(key) => setActiveTab(key as TabKey)}
    >
      {/* 筛选条件 */}
      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Row gutter={[0, 16]}>
          <Col xs={24} lg={2}>
            <Text type="secondary">类目：</Text>
          </Col>
          <Col xs={24} lg={22}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {filterOptions.map((f) => (
                <Tag.CheckableTag
                  key={f}
                  checked={selectedFilter === f}
                  onChange={() => setSelectedFilter(f)}
                >
                  {f}
                </Tag.CheckableTag>
              ))}
            </div>
          </Col>
          <Col xs={24} lg={2}>
            <Text type="secondary">作者：</Text>
          </Col>
          <Col xs={24} lg={22}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {owners.map((o) => (
                <Tag.CheckableTag
                  key={o}
                  checked={selectedOwner === o}
                  onChange={() => setSelectedOwner(o)}
                >
                  {o}
                </Tag.CheckableTag>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 列表内容 */}
      <Card variant="borderless">
        <List
          itemLayout="vertical"
          size="large"
          rowKey="id"
          dataSource={filteredData}
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
          }}
          renderItem={(item) => <ArticleListItem item={item} />}
        />
      </Card>
    </PageContainer>
  )
}

export default SearchListPage

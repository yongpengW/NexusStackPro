import { DownOutlined, PlusOutlined } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import {
  Avatar,
  Button,
  Card,
  Col,
  Dropdown,
  Input,
  List,
  Modal,
  Progress,
  Row,
  Segmented,
  Tag,
} from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

const { Search } = Input

interface BasicListItem {
  id: string
  title: string
  subDescription: string
  description: string
  owner: string
  href: string
  logo: string
  status: 'active' | 'exception' | 'normal'
  percent: number
  createdAt: string
}

const generateMockList = (count: number): BasicListItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    title: `任务 ${String(i + 1).padStart(2, '0')}`,
    subDescription: `这是一段描述文字，描述了任务的具体内容和目标，任务编号 ${i + 1}。`,
    description: `这是第 ${i + 1} 条任务的详细描述。`,
    owner: ['曲丽丽', '付小小', '林东东', '周星星'][i % 4],
    href: '',
    logo: `https://gw.alipayobjects.com/zos/rmsportal/${['WdGqmHpayyMjiEhcKoVE', 'zOsKZmFRdUtvpqCImOVY', 'dURIMkkrRFpPgTuzkwnB', 'siCFXmCn69ogdMXpjEDL', 'kZzMzemZyKLKFsojXItE'][i % 5]}.png`,
    status: (['active', 'exception', 'normal'] as const)[i % 3],
    percent: Math.floor(Math.random() * 80) + 20,
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
  }))

const ALL_LIST = generateMockList(50)

const ListContent: React.FC<{ data: BasicListItem }> = ({
  data: { owner, createdAt, percent, status },
}) => (
  <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
    <div style={{ minWidth: 72 }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>负责人</div>
      <div style={{ fontWeight: 500, marginTop: 4 }}>{owner}</div>
    </div>
    <div style={{ minWidth: 120 }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>开始时间</div>
      <div style={{ marginTop: 4 }}>{new Date(createdAt).toLocaleDateString()}</div>
    </div>
    <div style={{ width: 180 }}>
      <Progress percent={percent} status={status} strokeWidth={6} />
    </div>
  </div>
)

const MoreBtn: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({
  onEdit,
  onDelete,
}) => (
  <Dropdown
    menu={{
      items: [
        { key: 'edit', label: '编辑' },
        { key: 'delete', label: '删除' },
      ],
      onClick: ({ key }) => {
        if (key === 'edit') onEdit()
        else onDelete()
      },
    }}
  >
    <a>
      更多 <DownOutlined />
    </a>
  </Dropdown>
)

const BasicListPage: React.FC = () => {
  const { t } = useTranslation()
  const [list, setList] = useState<BasicListItem[]>(ALL_LIST)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const filteredList = list.filter((item) => {
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'progress' && item.status === 'active') ||
      (filterStatus === 'waiting' && item.status === 'normal')
    const matchSearch = !searchText || item.title.includes(searchText)
    return matchStatus && matchSearch
  })

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '删除任务',
      content: '确定删除该任务吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => setList((prev) => prev.filter((item) => item.id !== id)),
    })
  }

  return (
    <PageContainer title={t('menu.list.basic-list')} subTitle="基础列表展示了各类数据项的基本信息。">
      <Card variant="borderless" style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                borderRight: '1px solid #f0f0f0',
              }}
            >
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>我的待办</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>8 个任务</div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              style={{
                textAlign: 'center',
                padding: '8px 0',
                borderRight: '1px solid #f0f0f0',
              }}
            >
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>本周任务平均处理时间</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>32 分钟</div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>本周完成任务数</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>24 个任务</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        variant="borderless"
        title="基础列表"
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            <Segmented
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(String(val))
                setCurrentPage(1)
              }}
              options={[
                { label: '全部', value: 'all' },
                { label: '进行中', value: 'progress' },
                { label: '等待中', value: 'waiting' },
              ]}
            />
            <Search
              placeholder="请输入"
              onSearch={(v) => {
                setSearchText(v)
                setCurrentPage(1)
              }}
              style={{ width: 200 }}
              variant="filled"
            />
          </div>
        }
      >
        <List
          size="large"
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize,
            total: filteredList.length,
            onChange: setCurrentPage,
            showSizeChanger: false,
          }}
          dataSource={filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a key="edit">编辑</a>,
                <MoreBtn
                  key="more"
                  onEdit={() => {}}
                  onDelete={() => handleDelete(item.id)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={item.logo} shape="square" size="large" />}
                title={
                  <span>
                    <a href={item.href || '#'}>{item.title}</a>
                    <Tag
                      color={
                        item.status === 'active'
                          ? 'processing'
                          : item.status === 'exception'
                          ? 'error'
                          : 'default'
                      }
                      style={{ marginLeft: 8 }}
                    >
                      {item.status === 'active'
                        ? '进行中'
                        : item.status === 'exception'
                        ? '异常'
                        : '等待'}
                    </Tag>
                  </span>
                }
                description={item.subDescription}
              />
              <ListContent data={item} />
            </List.Item>
          )}
        />
      </Card>

      <Button
        type="dashed"
        style={{ width: '100%', marginTop: 16 }}
        icon={<PlusOutlined />}
      >
        添加
      </Button>
    </PageContainer>
  )
}

export default BasicListPage

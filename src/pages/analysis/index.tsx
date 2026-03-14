import {
  PageContainer,
  ProCard,
  StatisticCard,
} from '@ant-design/pro-components'
import { Col, Progress, Row, Table, Tag, Typography } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingOutlined,
  UserOutlined,
  DollarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import React from 'react'

const { Text } = Typography

const { Statistic } = StatisticCard

/** 最近访问记录 mock */
const visitColumns = [
  { title: '访问路径', dataIndex: 'path', key: 'path' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (s: number) => (
      <Tag color={s === 200 ? 'success' : s === 404 ? 'warning' : 'error'}>
        {s}
      </Tag>
    ),
  },
  { title: 'IP', dataIndex: 'ip', key: 'ip' },
  { title: '时间', dataIndex: 'time', key: 'time' },
]

const visitData = [
  { key: 1, path: '/api/user/list', status: 200, ip: '192.168.1.101', time: '2026-02-27 09:01' },
  { key: 2, path: '/api/order/create', status: 200, ip: '10.0.0.55', time: '2026-02-27 09:05' },
  { key: 3, path: '/api/product/detail', status: 404, ip: '172.16.0.12', time: '2026-02-27 09:08' },
  { key: 4, path: '/api/auth/login', status: 200, ip: '192.168.1.200', time: '2026-02-27 09:12' },
  { key: 5, path: '/api/report/export', status: 500, ip: '10.0.0.88', time: '2026-02-27 09:20' },
]

/** 销售趋势 mock（模拟 sparkline 用 Progress 代替） */
const salesData = [
  { label: '华东区', value: 78 },
  { label: '华南区', value: 62 },
  { label: '华北区', value: 45 },
  { label: '西南区', value: 33 },
  { label: '东北区', value: 21 },
]

function AnalysisPage() {
  return (
    <PageContainer
      title="数据分析"
      subTitle="实时监控平台核心数据"
    >
      {/* 核心指标卡片 */}
      <ProCard ghost gutter={[16, 16]} wrap style={{ marginBottom: 16 }}>
        <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }}>
          <StatisticCard
            statistic={{
              title: '总用户数',
              value: 126560,
              icon: <UserOutlined style={{ color: '#1677ff', fontSize: 32 }} />,
              description: (
                <Statistic
                  title="日同比"
                  value={12.2}
                  suffix="%"
                  trend="up"
                />
              ),
            }}
          />
        </ProCard>

        <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }}>
          <StatisticCard
            statistic={{
              title: '今日销售额',
              value: 89532,
              prefix: '¥',
              icon: <DollarOutlined style={{ color: '#52c41a', fontSize: 32 }} />,
              description: (
                <Statistic
                  title="周同比"
                  value={8.5}
                  suffix="%"
                  trend="up"
                />
              ),
            }}
          />
        </ProCard>

        <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }}>
          <StatisticCard
            statistic={{
              title: '今日订单数',
              value: 1683,
              icon: <ShoppingOutlined style={{ color: '#faad14', fontSize: 32 }} />,
              description: (
                <Statistic
                  title="日同比"
                  value={3.1}
                  suffix="%"
                  trend="down"
                />
              ),
            }}
          />
        </ProCard>

        <ProCard colSpan={{ xs: 24, sm: 12, md: 6 }}>
          <StatisticCard
            statistic={{
              title: '在线服务数',
              value: 42,
              icon: <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 32 }} />,
              description: (
                <Statistic
                  title="较昨日"
                  value={2}
                  suffix="个"
                  trend="up"
                />
              ),
            }}
          />
        </ProCard>
      </ProCard>

      {/* 第二行：区域销售 + 动态指标 */}
      <ProCard ghost gutter={[16, 16]} wrap style={{ marginBottom: 16 }}>
        <ProCard
          colSpan={{ xs: 24, md: 12 }}
          title="各区销售占比"
          bordered
          headerBordered
        >
          {salesData.map((item) => (
            <Row
              key={item.label}
              align="middle"
              gutter={8}
              style={{ marginBottom: 12 }}
            >
              <Col flex="60px">
                <Text type="secondary">{item.label}</Text>
              </Col>
              <Col flex="auto">
                <Progress
                  percent={item.value}
                  strokeColor={
                    item.value > 60
                      ? '#1677ff'
                      : item.value > 40
                      ? '#52c41a'
                      : '#faad14'
                  }
                  size="small"
                />
              </Col>
            </Row>
          ))}
        </ProCard>

        <ProCard
          colSpan={{ xs: 24, md: 12 }}
          title="关键指标概览"
          bordered
          headerBordered
        >
          <ProCard ghost gutter={[16, 16]} wrap>
            {[
              { label: '转化率', value: '68.2%', trend: 'up', delta: '+2.1%' },
              { label: '跳出率', value: '28.7%', trend: 'down', delta: '-1.3%' },
              { label: '平均停留', value: '4m 23s', trend: 'up', delta: '+0:15' },
              { label: 'API 成功率', value: '99.6%', trend: 'up', delta: '+0.2%' },
            ].map((item) => (
              <ProCard key={item.label} colSpan={12} bordered>
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{item.value}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      color: item.trend === 'up' ? '#52c41a' : '#ff4d4f',
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {item.trend === 'up' ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )}{' '}
                    {item.delta}
                  </div>
                </div>
              </ProCard>
            ))}
          </ProCard>
        </ProCard>
      </ProCard>

      {/* 第三行：最近访问记录 */}
      <ProCard title="最近访问记录" bordered headerBordered>
        <Table
          size="small"
          columns={visitColumns}
          dataSource={visitData}
          pagination={false}
        />
      </ProCard>
    </PageContainer>
  )
}

export default AnalysisPage

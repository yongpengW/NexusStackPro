import { PageContainer } from '@ant-design/pro-components'
import { Card, Col, Progress, Row, Statistic, Tag, Timeline, Typography } from 'antd'
import {
  ClockCircleOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  FireOutlined,
} from '@ant-design/icons'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const { Timer } = Statistic
const { Text } = Typography

const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30

const tagData = [
  { name: '前端开发', value: 38 },
  { name: '后台管理', value: 32 },
  { name: '数据可视化', value: 28 },
  { name: '移动端', value: 22 },
  { name: '微服务', value: 18 },
  { name: '人工智能', value: 15 },
  { name: 'DevOps', value: 12 },
  { name: '容器化', value: 10 },
  { name: '安全防护', value: 9 },
  { name: '性能优化', value: 8 },
]

const categoryData = [
  { name: '家用电器', percent: 75, color: '#1677ff' },
  { name: '食品饮料', percent: 48, color: '#52c41a' },
  { name: '服装服饰', percent: 33, color: '#faad14' },
]

const activityLog = [
  { time: '09:00', content: '服务器 CPU 利用率 42%，状态正常', color: 'green' },
  { time: '09:15', content: '新增订单 523 笔，总额 ¥86,420', color: 'blue' },
  { time: '09:30', content: '检测到异常请求 12 次，已自动拦截', color: 'red' },
  { time: '09:45', content: '数据库备份完成，耗时 2m 13s', color: 'green' },
  { time: '10:00', content: '系统内存使用率 68%，建议关注', color: 'orange' },
  { time: '10:15', content: '新增注册用户 89 人', color: 'blue' },
]

const MonitorPage: React.FC = () => {
  const { t } = useTranslation()
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <PageContainer title={t('menu.dashboard.monitor')} subTitle="整合展示系统实时运行状态">
      {/* 交易概览 */}
      <Card title="活动实时交易情况" variant="borderless" style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="今日交易总额"
              value={124543233}
              prefix="¥"
              formatter={(val) => Number(val).toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="销售目标完成率" value="92%" suffix={<RiseOutlined style={{ color: '#52c41a' }} />} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Timer type="countdown" title="活动剩余时间" value={deadline} format="HH:mm:ss" prefix={<ClockCircleOutlined />} />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic title="每秒交易总额（元）" value={234} prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />} />
          </Col>
        </Row>
      </Card>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        {/* 系统资源 */}
        <Col xs={24} lg={12}>
          <Card title="系统资源监控" variant="borderless" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
              {[
                { label: 'CPU 使用率', percent: 42, strokeColor: '#1677ff' },
                { label: '内存使用率', percent: 68, strokeColor: '#52c41a' },
                { label: '磁盘使用率', percent: 55, strokeColor: '#faad14' },
                { label: '网络带宽', percent: 30, strokeColor: '#722ed1' },
              ].map((item) => (
                <Col xs={12} key={item.label}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress type="dashboard" percent={item.percent} strokeColor={item.strokeColor} size={100} />
                    <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.65)', fontSize: 13 }}>{item.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 各品类占比 */}
        <Col xs={24} lg={12}>
          <Card title="各品类销售占比" variant="borderless" style={{ marginBottom: 24 }}>
            {categoryData.map((item) => (
              <Row key={item.name} align="middle" gutter={8} style={{ marginBottom: 16 }}>
                <Col flex="80px">
                  <Text>{item.name}</Text>
                </Col>
                <Col flex="auto">
                  <Progress percent={item.percent} strokeColor={item.color} />
                </Col>
              </Row>
            ))}
          </Card>
          <Card title="资源剩余" variant="borderless">
            <Row gutter={16} style={{ textAlign: 'center' }}>
              <Col span={8}>
                <Statistic title="存储空间" value="35%" suffix={<TrophyOutlined style={{ color: '#1677ff' }} />} />
              </Col>
              <Col span={8}>
                <Statistic title="数据库容量" value="62%" suffix={<FireOutlined style={{ color: '#ff4d4f' }} />} />
              </Col>
              <Col span={8}>
                <Statistic title="备份余量" value="78%" suffix={<ThunderboltOutlined style={{ color: '#52c41a' }} />} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* 热门搜索标签 */}
        <Col xs={24} lg={12} style={{ marginBottom: 24 }}>
          <Card title="热门搜索标签" variant="borderless">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
              {tagData.map((item) => (
                <Tag
                  key={item.name}
                  color="blue"
                  style={{ fontSize: 10 + Math.floor(item.value / 10) * 2, padding: '2px 8px', margin: 0 }}
                >
                  {item.name}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>

        {/* 活动日志 */}
        <Col xs={24} lg={12} style={{ marginBottom: 24 }}>
          <Card title="实时活动日志" variant="borderless"
            extra={<Text type="secondary">{currentTime.toLocaleTimeString()}</Text>}
          >
            <Timeline
              items={activityLog.map((item) => ({
                color: item.color,
                children: (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>{item.time}</Text>
                    <Text>{item.content}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default MonitorPage
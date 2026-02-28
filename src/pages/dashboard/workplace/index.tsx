import {
  AppstoreOutlined,
  FileTextOutlined,
  PlusOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import {
  Avatar,
  Card,
  Col,
  List,
  Row,
  Statistic,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Text, Paragraph } = Typography

const currentUser = {
  name: '吴彦祖',
  avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  title: '交互专家',
  group: '蚂蚁金服－某某某事业群－某某平台部－某某技术部－UED',
}

const quickLinks = [
  { title: 'ProTable 文档', href: 'https://procomponents.ant.design/components/table', icon: <FileTextOutlined /> },
  { title: 'ProForm 文档', href: 'https://procomponents.ant.design/components/form', icon: <FileTextOutlined /> },
  { title: 'Ant Design', href: 'https://ant.design', icon: <AppstoreOutlined /> },
  { title: '成员管理', href: '/account/center', icon: <TeamOutlined /> },
  { title: '系统设置', href: '/account/settings', icon: <SettingOutlined /> },
  { title: '组件市场', href: 'https://procomponents.ant.design', icon: <AppstoreOutlined /> },
]

const projects = [
  { id: 1, title: 'Ant Design Pro', logo: 'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png', description: '基于 ant design 的企业级 UI 组件', member: '曲丽丽', href: '', updatedAt: '2024-12-01T10:00:00Z' },
  { id: 2, title: 'Ant Design', logo: 'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png', description: '全球最流行的 React UI 框架', member: '曲丽丽', href: '', updatedAt: '2024-11-25T08:00:00Z' },
  { id: 3, title: 'Pro Components', logo: 'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png', description: '高质量的 Pro 业务组件', member: '付小小', href: '', updatedAt: '2024-11-20T14:00:00Z' },
  { id: 4, title: 'Umi', logo: 'https://gw.alipayobjects.com/zos/rmsportal/siCFXmCn69ogdMXpjEDL.png', description: '可扩展的企业级前端框架', member: '林东东', href: '', updatedAt: '2024-11-15T08:00:00Z' },
  { id: 5, title: 'Dva', logo: 'https://gw.alipayobjects.com/zos/rmsportal/siCFXmCn69ogdMXpjEDL.png', description: '基于 redux 和 redux-saga 的数据流方案', member: '周星星', href: '', updatedAt: '2024-11-10T09:00:00Z' },
  { id: 6, title: 'Bigfish', logo: 'https://gw.alipayobjects.com/zos/rmsportal/kZzMzemZyKLKFsojXItE.png', description: '封装了丰富业务特性的内部框架', member: '吴加好', href: '', updatedAt: '2024-11-05T11:00:00Z' },
]

const activities = [
  { id: 1, user: { name: '曲丽丽', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png' }, action: '在', target: { name: 'Ant Design Pro', link: '' }, updatedAt: '2024-12-05T08:00:00Z', desc: '新建了项目' },
  { id: 2, user: { name: '付小小', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/cnrhVkzwxjPwAaCfPbdc.png' }, action: '在', target: { name: 'Pro Components', link: '' }, updatedAt: '2024-12-04T10:00:00Z', desc: '提交了代码' },
  { id: 3, user: { name: '林东东', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png' }, action: '同意了', target: { name: 'Umi', link: '' }, updatedAt: '2024-12-03T12:00:00Z', desc: '的合并请求' },
  { id: 4, user: { name: '周星星', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJE.png' }, action: '关闭了', target: { name: 'Dva', link: '' }, updatedAt: '2024-12-02T14:00:00Z', desc: '一个 Bug' },
  { id: 5, user: { name: '吴加好', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png' }, action: '发布了', target: { name: 'Bigfish', link: '' }, updatedAt: '2024-12-01T16:00:00Z', desc: '1.2.0 版本' },
]

const radarItems = [
  { name: '引用', value: 10 },
  { name: '口碑', value: 8 },
  { name: '产品', value: 7 },
  { name: '贡献', value: 5 },
  { name: '热度', value: 9 },
]

const WorkplacePage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t('menu.dashboard.workplace')}
      content={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar size={64} src={currentUser.avatar} style={{ marginRight: 16 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              早安，{currentUser.name}，祝你开心每一天！
            </div>
            <div style={{ color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
              {currentUser.title} | {currentUser.group}
            </div>
          </div>
        </div>
      }
      extraContent={
        <Row gutter={32}>
          <Col><Statistic title="项目数" value={56} /></Col>
          <Col><Statistic title="团队内排名" value={8} suffix="/ 24" /></Col>
          <Col><Statistic title="项目访问" value={2223} /></Col>
        </Row>
      }
    >
      <Row gutter={24}>
        {/* 左侧：进行中的项目 + 动态 */}
        <Col xs={24} xl={16}>
          <Card
            title="进行中的项目"
            variant="borderless"
            style={{ marginBottom: 24 }}
            extra={<Link to="/">全部项目</Link>}
          >
            <Row gutter={[16, 16]}>
              {projects.map((item) => (
                <Col xs={24} sm={12} key={item.id}>
                  <Card.Grid
                    style={{
                      width: '100%',
                      padding: 16,
                      boxShadow: 'none',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <Avatar size={24} src={item.logo} style={{ marginRight: 8 }} />
                      <Text strong style={{ flex: 1 }}>
                        {item.title}
                      </Text>
                    </div>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginBottom: 8 }}
                    >
                      {item.description}
                    </Paragraph>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: 'rgba(0,0,0,0.45)',
                        fontSize: 12,
                      }}
                    >
                      <span>{item.member}</span>
                      <span>{dayjs(item.updatedAt).fromNow()}</span>
                    </div>
                  </Card.Grid>
                </Col>
              ))}
            </Row>
          </Card>

          <Card title="动态" variant="borderless" style={{ marginBottom: 24 }}>
            <List
              dataSource={activities}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar src={item.user.avatar} />}
                    title={
                      <span>
                        <Text strong>{item.user.name}</Text>
                        <Text type="secondary" style={{ margin: '0 4px' }}>
                          {item.action}
                        </Text>
                        <a href={item.target.link}>{item.target.name}</a>
                        <Text style={{ marginLeft: 4 }}>{item.desc}</Text>
                      </span>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.updatedAt).fromNow()}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 右侧：快速导航 + 指数 + 团队 */}
        <Col xs={24} xl={8}>
          <Card title="快速开始 / 便捷导航" variant="borderless" style={{ marginBottom: 24 }}>
            <Row gutter={[8, 8]}>
              {quickLinks.map((link) => (
                <Col span={12} key={link.title}>
                  {link.href.startsWith('http') ? (
                    <a href={link.href} target="_blank" rel="noreferrer">
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 12px',
                          border: '1px dashed #d9d9d9',
                          borderRadius: 6,
                          color: '#1677ff',
                          fontSize: 13,
                        }}
                      >
                        {link.icon}
                        <span>{link.title}</span>
                      </div>
                    </a>
                  ) : (
                    <Link to={link.href}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 12px',
                          border: '1px dashed #d9d9d9',
                          borderRadius: 6,
                          color: '#1677ff',
                          fontSize: 13,
                        }}
                      >
                        {link.icon}
                        <span>{link.title}</span>
                      </div>
                    </Link>
                  )}
                </Col>
              ))}
              <Col span={12}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    border: '1px dashed #d9d9d9',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: 'rgba(0,0,0,0.45)',
                    fontSize: 13,
                  }}
                >
                  <PlusOutlined />
                  <span>添加</span>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="XX 指数" variant="borderless" style={{ marginBottom: 24 }}>
            {radarItems.map((item) => (
              <Row key={item.name} align="middle" gutter={8} style={{ marginBottom: 12 }}>
                <Col flex="60px">
                  <Text>{item.name}</Text>
                </Col>
                <Col flex="auto">
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: '#f0f0f0',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.value * 10}%`,
                        background: '#1677ff',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </Col>
                <Col flex="30px">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.value}
                  </Text>
                </Col>
              </Row>
            ))}
          </Card>

          <Card title="团队成员" variant="borderless">
            <Row gutter={[16, 16]}>
              {projects.map((item) => (
                <Col span={12} key={item.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size={24} src={item.logo} />
                    <Text style={{ fontSize: 13 }}>{item.member}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}

export default WorkplacePage

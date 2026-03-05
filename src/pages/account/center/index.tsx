import {
  ClusterOutlined,
  ContactsOutlined,
  HomeOutlined,
  LikeOutlined,
  LinkOutlined,
  MessageOutlined,
  PlusOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { GridContent } from '@ant-design/pro-components'
import {
  Avatar,
  Card,
  Col,
  Divider,
  Input,
  type InputRef,
  List,
  Row,
  Tag,
  Typography,
} from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { UserApi, type CurrentUserDto, Gender } from '@/services/user'
import { formatDateTime } from '@/utils/dateUtils'

const { Paragraph } = Typography

// ─────────────────────────────────────────────
// Mock 数据
// ─────────────────────────────────────────────
const teamList = [
  { id: '1', member: '科学搬砖组', logo: 'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png', href: '' },
  { id: '2', member: '全组都是吴彦祖', logo: 'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png', href: '' },
  { id: '3', member: '中二少女组', logo: 'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png', href: '' },
  { id: '4', member: 'Ant Design', logo: 'https://gw.alipayobjects.com/zos/rmsportal/siCFXmCn69ogdMXpjEDL.png', href: '' },
]

const defaultTags = [
  { key: '1', label: '很有想法' },
  { key: '2', label: '专注设计' },
  { key: '3', label: '辣~' },
  { key: '4', label: '大长腿' },
  { key: '5', label: '川妹子' },
  { key: '6', label: '海纳百川' },
]

const articles = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: `Ant Design 第 ${i + 1} 篇文章：深入理解 React 组件设计`,
  description: '这是一篇关于 React 组件设计的深度文章，介绍了最佳实践和常见的设计模式，让你的组件更加可维护...',
  like: Math.floor(Math.random() * 200) + 10,
  message: Math.floor(Math.random() * 50) + 1,
  star: Math.floor(Math.random() * 100) + 5,
  updatedAt: `2024-${String(12 - i % 3).padStart(2, '0')}-${String(28 - i).padStart(2, '0')}`,
}))

const apps = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: ['工单系统', '监控大屏', '报表中心', '权限管理', '消息中心', '数据字典', '审批流程', '系统日志'][i],
  description: '这是一个常用的内部应用，集成了核心业务功能，提升了工作效率。',
  logo: `https://gw.alipayobjects.com/zos/rmsportal/${['WdGqmHpayyMjiEhcKoVE', 'zOsKZmFRdUtvpqCImOVY', 'dURIMkkrRFpPgTuzkwnB', 'siCFXmCn69ogdMXpjEDL', 'kZzMzemZyKLKFsojXItE', 'WhxKECPNujWoWEFNdnJE', 'ubnKSIfAJTxIgXOKlciN', 'gaOngJwsRYRaVAuXXcmB'][i]}.png`,
  href: '',
}))

const projects = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 1),
  title: `项目 ${String.fromCharCode(65 + i)}：企业级中台建设`,
  description: [`蚂蚁金服体验技术部 - ${['UED', '前端', '全栈', '设计', 'PM', 'QA', '运维', '架构'][i]}`, '2024-12-01'][i % 2],
  logo: `https://gw.alipayobjects.com/zos/rmsportal/${['WdGqmHpayyMjiEhcKoVE', 'zOsKZmFRdUtvpqCImOVY', 'dURIMkkrRFpPgTuzkwnB', 'siCFXmCn69ogdMXpjEDL', 'kZzMzemZyKLKFsojXItE', 'WhxKECPNujWoWEFNdnJE', 'ubnKSIfAJTxIgXOKlciN', 'gaOngJwsRYRaVAuXXcmB'][i]}.png`,
  href: '',
  activeUser: Math.floor(Math.random() * 200) + 20,
  newUser: Math.floor(Math.random() * 50) + 5,
}))

// ─────────────────────────────────────────────
// 标签组件
// ─────────────────────────────────────────────
interface TagItem { key: string; label: string }

const TagList: React.FC<{ tags: TagItem[] }> = ({ tags: initTags }) => {
  const ref = useRef<InputRef | null>(null)
  const [tags, setTags] = useState<TagItem[]>(initTags)
  const [inputVisible, setInputVisible] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleConfirm = () => {
    if (inputValue && !tags.find((t) => t.label === inputValue)) {
      setTags([...tags, { key: `new-${tags.length}`, label: inputValue }])
    }
    setInputVisible(false)
    setInputValue('')
  }

  return (
    <div>
      <div style={{ color: 'rgba(0,0,0,0.85)', fontWeight: 500, marginBottom: 8 }}>标签</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag) => <Tag key={tag.key}>{tag.label}</Tag>)}
        {inputVisible ? (
          <Input
            ref={ref}
            size="small"
            style={{ width: 78 }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleConfirm}
            onPressEnter={handleConfirm}
            autoFocus
          />
        ) : (
          <Tag
            onClick={() => { setInputVisible(true); setTimeout(() => ref.current?.focus(), 0) }}
            style={{ borderStyle: 'dashed', cursor: 'pointer' }}
          >
            <PlusOutlined />
          </Tag>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Tab 内容
// ─────────────────────────────────────────────
const IconText: React.FC<{ icon: React.ReactNode; text: React.ReactNode }> = ({ icon, text }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(0,0,0,0.45)' }}>
    {icon} {text}
  </span>
)

const ArticlesTab: React.FC = () => (
  <List
    itemLayout="vertical"
    dataSource={articles}
    renderItem={(item) => (
      <List.Item
        key={item.id}
        actions={[
          <IconText key="star" icon={<StarOutlined />} text={item.star} />,
          <IconText key="like" icon={<LikeOutlined />} text={item.like} />,
          <IconText key="msg" icon={<MessageOutlined />} text={item.message} />,
        ]}
      >
        <List.Item.Meta
          title={<a href="#">{item.title}</a>}
          description={<Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph>}
        />
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>{item.updatedAt}</span>
      </List.Item>
    )}
  />
)

const ApplicationsTab: React.FC = () => (
  <List
    grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
    dataSource={apps}
    renderItem={(item) => (
      <List.Item key={item.id}>
        <Card hoverable>
          <Card.Meta
            avatar={<Avatar src={item.logo} size={48} />}
            title={<a href={item.href || '#'}>{item.title}</a>}
            description={<Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph>}
          />
          <div style={{ marginTop: 12 }}>
            <a href={item.href || '#'}><LinkOutlined style={{ marginRight: 4 }} />访问</a>
          </div>
        </Card>
      </List.Item>
    )}
  />
)

const ProjectsTab: React.FC = () => (
  <List
    grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
    dataSource={projects}
    renderItem={(item) => (
      <List.Item key={item.id}>
        <Card hoverable>
          <Card.Meta
            avatar={<Avatar src={item.logo} size={48} />}
            title={<a href={item.href || '#'}>{item.title}</a>}
            description={<Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph>}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            <span>活跃用户 {item.activeUser}</span>
            <span>新增 {item.newUser}</span>
          </div>
        </Card>
      </List.Item>
    )}
  />
)

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
type TabKey = 'articles' | 'applications' | 'projects'

const AccountCenterPage: React.FC = () => {
  const [tabKey, setTabKey] = useState<TabKey>('articles')
  const userInfo = useAppStore((s) => s.userInfo)

  const [me, setMe] = useState<CurrentUserDto | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await UserApi.getMe()
        if (mounted) setMe(data)
      } catch {
        // 静默失败，保持占位内容
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const avatar =
    me?.avatar || userInfo?.avatar || 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png'
  const name = me?.realName || me?.nickName || userInfo?.userName || '未登录用户'

  const genderLabel =
    me?.gender === Gender.Male ? '男' : me?.gender === Gender.Female ? '女' : me ? '未知' : '—'

  const renderContent = () => {
    if (tabKey === 'articles') return <ArticlesTab />
    if (tabKey === 'applications') return <ApplicationsTab />
    return <ProjectsTab />
  }

  return (
    <GridContent>
      <Row gutter={24}>
        {/* 左侧：用户信息 */}
        <Col xs={24} lg={7}>
          <Card variant="borderless" style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <Avatar size={104} src={avatar} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{name}</div>
              <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>
                {me?.nickName || '海纳百川，有容乃大'}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}>
                <ContactsOutlined style={{ marginRight: 8 }} />
                真实姓名：{me?.realName || '—'}
              </p>
              <p style={{ marginBottom: 8 }}>
                <ClusterOutlined style={{ marginRight: 8 }} />
                昵称：{me?.nickName || '—'}
              </p>
              <p style={{ marginBottom: 0 }}>
                <HomeOutlined style={{ marginRight: 8 }} />
                性别：{genderLabel}
              </p>
              <p style={{ marginBottom: 0, marginTop: 8 }}>
                <LinkOutlined style={{ marginRight: 8 }} />
                邮箱：{me?.email || '—'}
              </p>
              <p style={{ marginBottom: 0, marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                上次登录时间：{formatDateTime(me?.lastLoginTime)}
              </p>
            </div>
            <Divider dashed />
            <TagList tags={defaultTags} />
            <Divider dashed style={{ marginTop: 16 }} />
            <div>
              <div style={{ color: 'rgba(0,0,0,0.85)', fontWeight: 500, marginBottom: 8 }}>团队</div>
              <Row gutter={[16, 12]}>
                {teamList.map((item) => (
                  <Col span={12} key={item.id}>
                    <a href={item.href || '#'} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size={24} src={item.logo} />
                      <span style={{ fontSize: 13 }}>{item.member}</span>
                    </a>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </Col>

        {/* 右侧：Tab 内容 */}
        <Col xs={24} lg={17}>
          <Card variant="borderless"
            tabList={[
              { key: 'articles', tab: <span>文章 <span style={{ fontSize: 14 }}>(8)</span></span> },
              { key: 'applications', tab: <span>应用 <span style={{ fontSize: 14 }}>(8)</span></span> },
              { key: 'projects', tab: <span>项目 <span style={{ fontSize: 14 }}>(8)</span></span> },
            ]}
            activeTabKey={tabKey}
            onTabChange={(key) => setTabKey(key as TabKey)}
          >
            {renderContent()}
          </Card>
        </Col>
      </Row>
    </GridContent>
  )
}

export default AccountCenterPage

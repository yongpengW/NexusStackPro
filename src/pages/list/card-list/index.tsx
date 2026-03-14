import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import { Avatar, Button, Card, List, Typography } from 'antd'
import { useTranslation } from 'react-i18next'

const { Paragraph } = Typography

interface CardListItem {
  id: string
  title: string
  description: string
  avatar: string
  href: string
  updateAt: string
  owner: string
}

const mockList: CardListItem[] = [
  { id: '1', title: 'Ant Design', description: '全球最流行的 React UI 框架，由蚂蚁集团出品。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png', href: 'https://ant.design', updateAt: '2024-12-01', owner: '蚂蚁集团' },
  { id: '2', title: 'Ant Design Pro', description: '企业级中后台前端/设计解决方案，基于 Ant Design。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png', href: 'https://pro.ant.design', updateAt: '2024-11-28', owner: '蚂蚁集团' },
  { id: '3', title: 'Pro Components', description: '高质量 ProTable、ProForm、ProLayout 等企业级组件库。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png', href: 'https://procomponents.ant.design', updateAt: '2024-11-20', owner: '蚂蚁集团' },
  { id: '4', title: 'Umi', description: '可扩展的企业级前端应用框架，基于 React。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/siCFXmCn69ogdMXpjEDL.png', href: 'https://umijs.org', updateAt: '2024-11-15', owner: 'Umi Team' },
  { id: '5', title: 'Dva', description: '基于 redux 和 redux-saga 的数据流方案，对 model 概念进行抽象。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/kZzMzemZyKLKFsojXItE.png', href: 'https://dvajs.com', updateAt: '2024-11-10', owner: 'Dva Team' },
  { id: '6', title: 'React', description: '用于构建用户界面的 JavaScript 库，由 Meta 出品。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJE.png', href: 'https://reactjs.org', updateAt: '2024-11-05', owner: 'Meta' },
  { id: '7', title: 'TypeScript', description: 'JavaScript 的超集，添加了静态类型检查。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png', href: 'https://typescriptlang.org', updateAt: '2024-10-28', owner: 'Microsoft' },
  { id: '8', title: 'Vite', description: '极速的现代前端构建工具，支持热模块替换。', avatar: 'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png', href: 'https://vitejs.dev', updateAt: '2024-10-20', owner: 'Vite Team' },
]

const nullItem = {} as Partial<CardListItem>

function CardListPage() {
  const { t } = useTranslation()
  return (
    <PageContainer
      title={t('menu.list.card-list')}
      content={
        <div>
          <p>
            蚂蚁金服务设计平台 ant.design，用最小的工作量，无缝接入蚂蚁金服生态，提供跨越设计与开发的体验解决方案。
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <a href="https://ant.design" target="_blank" rel="noreferrer">
              🚀 快速开始
            </a>
            <a href="https://ant.design/docs/react/introduce-cn" target="_blank" rel="noreferrer">
              📋 产品简介
            </a>
            <a href="https://ant.design/components/overview-cn" target="_blank" rel="noreferrer">
              📄 产品文档
            </a>
          </div>
        </div>
      }
    >
      <List<Partial<CardListItem>>
        rowKey="id"
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={[nullItem, ...mockList]}
        renderItem={(item) => {
          if (item?.id) {
            return (
              <List.Item key={item.id}>
                <Card
                  hoverable
                  actions={[
                    <a key="option1" onClick={() => {}}>操作一</a>,
                    <a key="option2" onClick={() => {}}>操作二</a>,
                    <EllipsisOutlined key="more" />,
                  ]}
                >
                  <Card.Meta
                    avatar={<Avatar src={item.avatar} size={48} />}
                    title={<a href={item.href} target="_blank" rel="noreferrer">{item.title}</a>}
                    description={
                      <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 0 }}>
                        {item.description}
                      </Paragraph>
                    }
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                    <span>{item.owner}</span>
                    <span>{item.updateAt}</span>
                  </div>
                </Card>
              </List.Item>
            )
          }
          return (
            <List.Item>
              <Button
                type="dashed"
                style={{ width: '100%', height: 178, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(0,0,0,0.45)' }}
                icon={<PlusOutlined style={{ fontSize: 20 }} />}
              >
                新增产品
              </Button>
            </List.Item>
          )
        }}
      />
    </PageContainer>
  )
}

export default CardListPage

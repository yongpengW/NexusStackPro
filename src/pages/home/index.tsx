import { ProCard, PageContainer } from '@ant-design/pro-components'
import { Typography, Space, Tag, Button, App } from 'antd'
import { SmileOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Title, Paragraph } = Typography

const HomePage: React.FC = () => {
  const { message } = App.useApp()
  const { t } = useTranslation()

  return (
    <PageContainer
      title={t('pages.home.title')}
      subTitle={t('pages.home.subTitle')}
      extra={[
        <Button key="help" onClick={() => message.info(t('pages.home.btn.help'))}>{t('pages.home.btn.help')}</Button>,
        <Button key="start" type="primary" onClick={() => message.success(t('pages.home.btn.start'))}>{t('pages.home.btn.start')}</Button>,
      ]}
    >
      <ProCard direction="column" ghost gutter={[0, 16]}>
        <ProCard>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space align="center">
              <SmileOutlined style={{ fontSize: 32, color: '#1677ff' }} />
              <Title level={3} style={{ margin: 0 }}>
                {t('pages.home.welcome')}
              </Title>
            </Space>
            <Paragraph type="secondary">
              {t('pages.home.desc')}
            </Paragraph>
            <Space wrap>
              <Tag color="blue">React 19</Tag>
              <Tag color="geekblue">TypeScript</Tag>
              <Tag color="purple">Ant Design v5</Tag>
              <Tag color="cyan">ProComponents</Tag>
              <Tag color="green">Zustand</Tag>
              <Tag color="orange">React Router v7</Tag>
            </Space>
            <Button type="primary" onClick={() => message.success(t('pages.home.test'))}>
              {t('pages.home.test')}
            </Button>
          </Space>
        </ProCard>

        <ProCard colSpan={{ xs: 24, sm: 12, md: 8 }} ghost gutter={16} wrap>
          <ProCard title={t('pages.home.tips.start')} bordered>
            <Paragraph>{t('pages.home.tips.start.desc')}</Paragraph>
          </ProCard>
          <ProCard title={t('pages.home.tips.router')} bordered>
            <Paragraph>{t('pages.home.tips.router.desc')}</Paragraph>
          </ProCard>
          <ProCard title={t('pages.home.tips.store')} bordered>
            <Paragraph>{t('pages.home.tips.store.desc')}</Paragraph>
          </ProCard>
        </ProCard>
      </ProCard>
    </PageContainer>
  )
}

export default HomePage
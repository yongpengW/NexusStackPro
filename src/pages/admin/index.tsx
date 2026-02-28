import { HeartTwoTone, SmileTwoTone } from '@ant-design/icons'
import { PageContainer } from '@ant-design/pro-components'
import { Alert, Card, Typography } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next'

const AdminPage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <PageContainer content={t('pages.admin.subTitle')}>
      <Card>
        <Alert
          message={t('pages.admin.alertMessage')}
          type="success"
          showIcon
          banner
          style={{
            margin: -12,
            marginBottom: 48,
          }}
        />
        <Typography.Title level={2} style={{ textAlign: 'center' }}>
          <SmileTwoTone /> Ant Design Pro{' '}
          <HeartTwoTone twoToneColor="#eb2f96" /> You
        </Typography.Title>
      </Card>
      <p style={{ textAlign: 'center', marginTop: 24 }}>
        Want to add more pages? Please refer to{' '}
        <a
          href="https://pro.ant.design/docs/block-cn"
          target="_blank"
          rel="noopener noreferrer"
        >
          use block
        </a>
        。
      </p>
    </PageContainer>
  )
}

export default AdminPage

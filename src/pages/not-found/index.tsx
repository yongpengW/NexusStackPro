import { Button, Card, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <Card variant="borderless">
      <Result
        status="404"
        title="404"
        subTitle={t('pages.404.subTitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            {t('pages.404.backHome')}
          </Button>
        }
      />
    </Card>
  )
}

export default NotFoundPage

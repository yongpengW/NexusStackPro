import { Link } from 'react-router-dom'
import { Button, Card, Result } from 'antd'

const Exception500: React.FC = () => (
  <Card variant="borderless">
    <Result
      status="500"
      title="500"
      subTitle="抱歉，服务器出现了错误，请稍后重试。"
      extra={
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      }
    />
  </Card>
)

export default Exception500

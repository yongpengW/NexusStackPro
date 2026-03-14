import { Link } from 'react-router-dom'
import { Button, Card, Result } from 'antd'

function Exception403() {
  return (
  <Card variant="borderless">
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问该页面。"
      extra={
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      }
    />
  </Card>
  )
}

export default Exception403

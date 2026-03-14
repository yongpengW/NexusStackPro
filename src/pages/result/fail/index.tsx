import { CloseCircleOutlined, RightOutlined } from '@ant-design/icons'
import { GridContent } from '@ant-design/pro-components'
import { Button, Card, Result } from 'antd'
import { Link } from 'react-router-dom'

function ResultFail() {
  const content = (
    <>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginBottom: 8, display: 'block' }}>您提交的内容有如下错误：</span>
        <div style={{ marginBottom: 12 }}>
          <CloseCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
          <span>您的账户已被冻结</span>
          <a style={{ marginLeft: 16 }}>
            <span>立即解冻</span>
            <RightOutlined />
          </a>
        </div>
        <div>
          <CloseCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
          <span>您的账户还不具备申请资格</span>
          <a style={{ marginLeft: 16 }}>
            <span>立即升级</span>
            <RightOutlined />
          </a>
        </div>
      </div>
    </>
  )

  return (
    <GridContent>
      <Card variant="borderless">
        <Result
          status="error"
          title="提交失败"
          subTitle="请核对并修改以下信息后，再重新提交"
          extra={
            <Link to="/form/basic-form">
              <Button type="primary">返回修改</Button>
            </Link>
          }
          style={{ marginTop: 48, marginBottom: 16 }}
        >
          {content}
        </Result>
      </Card>
    </GridContent>
  )
}

export default ResultFail

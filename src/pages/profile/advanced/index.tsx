import {
  DingdingOutlined,
  DownOutlined,
  EllipsisOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { GridContent, PageContainer } from '@ant-design/pro-components'
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Dropdown,
  Empty,
  Popover,
  Space,
  Statistic,
  Steps,
  Table,
  Tooltip,
} from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

// ─────────────────────────────────────────────
// Mock 操作日志数据
// ─────────────────────────────────────────────
interface LogItem {
  key: string
  type: string
  name: string
  status: 'agree' | 'reject'
  updatedAt: string
  memo: string
}

const log1: LogItem[] = [
  { key: '1', type: '工单创建', name: '曲丽丽', status: 'agree', updatedAt: '2017-10-01 14:10', memo: '无' },
  { key: '2', type: '部门初审', name: '付小小', status: 'agree', updatedAt: '2017-10-01 16:00', memo: '审核通过' },
]
const log2: LogItem[] = [
  { key: '1', type: '财务审核', name: '周星星', status: 'agree', updatedAt: '2017-10-02 09:00', memo: '金额核对无误' },
  { key: '2', type: '法务复核', name: '林东东', status: 'reject', updatedAt: '2017-10-02 11:30', memo: '需补充材料' },
]
const log3: LogItem[] = [
  { key: '1', type: '最终审批', name: '吴加好', status: 'agree', updatedAt: '2017-10-03 10:00', memo: '正式批准' },
]

const columns = [
  { title: '操作类型', dataIndex: 'type', key: 'type' },
  { title: '操作员', dataIndex: 'name', key: 'name' },
  {
    title: '执行结果',
    dataIndex: 'status',
    key: 'status',
    render: (text: string) =>
      text === 'agree' ? (
        <Badge status="success" text="成功" />
      ) : (
        <Badge status="error" text="驳回" />
      ),
  },
  { title: '操作时间', dataIndex: 'updatedAt', key: 'updatedAt' },
  { title: '备注', dataIndex: 'memo', key: 'memo' },
]

const operationTabList = [
  { key: 'tab1', tab: '操作日志一' },
  { key: 'tab2', tab: '操作日志二' },
  { key: 'tab3', tab: '操作日志三' },
]

type OperationKey = 'tab1' | 'tab2' | 'tab3'
type PageTab = 'detail' | 'rule'

function AdvancedProfilePage() {
  const { t } = useTranslation()
  const [tabKey, setTabKey] = useState<PageTab>('detail')
  const [opKey, setOpKey] = useState<OperationKey>('tab1')

  const contentList: Record<OperationKey, React.ReactNode> = {
    tab1: <Table<LogItem> pagination={false} dataSource={log1} columns={columns} rowKey="key" />,
    tab2: <Table<LogItem> pagination={false} dataSource={log2} columns={columns} rowKey="key" />,
    tab3: <Table<LogItem> pagination={false} dataSource={log3} columns={columns} rowKey="key" />,
  }

  const customDot = (dot: React.ReactNode, { status }: { status: string }) => {
    if (status === 'process') {
      return (
        <Popover
          placement="topLeft"
          content={
            <div style={{ width: 160 }}>
              吴加好
              <span style={{ float: 'right' }}>
                <Badge
                  status="default"
                  text={
                    <span style={{ color: 'rgba(0,0,0,0.45)' }}>未响应</span>
                  }
                />
              </span>
              <div style={{ marginTop: 4 }}>耗时已 1 小时 25 分钟</div>
            </div>
          }
        >
          <span>{dot}</span>
        </Popover>
      )
    }
    return dot
  }

  const desc1 = (
    <div>
      曲丽丽
      <DingdingOutlined style={{ marginLeft: 8 }} />
      <div>2016-12-12 12:32</div>
    </div>
  )

  const desc2 = (
    <div>
      周毛毛
      <DingdingOutlined style={{ color: '#00A0E9', marginLeft: 8 }} />
      <div>
        <a href="">催一下</a>
      </div>
    </div>
  )

  const extraActions = (
    <Space>
      <Button.Group>
        <Button>操作一</Button>
        <Button>操作二</Button>
        <Dropdown
          menu={{
            items: [
              { key: '1', label: '选项一' },
              { key: '2', label: '选项二' },
              { key: '3', label: '选项三' },
            ],
          }}
          placement="bottomRight"
        >
          <Button>
            <EllipsisOutlined />
          </Button>
        </Dropdown>
      </Button.Group>
      <Button type="primary">主操作</Button>
    </Space>
  )

  const dropdownActions = (
    <Dropdown.Button
      type="primary"
      icon={<DownOutlined />}
      menu={{
        items: [
          { key: '1', label: '操作一' },
          { key: '2', label: '操作二' },
          { key: '3', label: '操作三' },
        ],
      }}
    >
      主操作
    </Dropdown.Button>
  )

  return (
    <PageContainer
      title={t('menu.profile.advanced')}
      extra={tabKey === 'detail' ? [extraActions] : [dropdownActions]}
      extraContent={
        <Space size={32}>
          <Statistic title="状态" value="待审批" />
          <Statistic title="订单金额" prefix="¥" value={568.08} />
        </Space>
      }
      tabList={[
        { key: 'detail', tab: '详情' },
        { key: 'rule', tab: '规则' },
      ]}
      tabActiveKey={tabKey}
      onTabChange={(key) => setTabKey(key as PageTab)}
    >
      {tabKey === 'detail' && (
        <GridContent>
          {/* 流程进度 */}
          <Card
            title="流程进度"
            style={{ marginBottom: 24 }}
            extra={
              <Tooltip title="请根据实际情况进行操作">
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            <Steps
              progressDot={customDot}
              current={1}
              items={[
                {
                  title: '创建项目',
                  description: desc1,
                },
                {
                  title: '部门初审',
                  description: desc2,
                },
                {
                  title: '财务复核',
                  description: '2016-12-12 12:32',
                },
                {
                  title: '完成',
                  description: '2016-12-12 12:32',
                },
              ]}
            />
          </Card>

          {/* 用户信息 */}
          <Card title="用户信息" style={{ marginBottom: 24 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="用户姓名">付小小</Descriptions.Item>
              <Descriptions.Item label="会员卡号">32943898021309809423</Descriptions.Item>
              <Descriptions.Item label="身份证">3321944288191034921</Descriptions.Item>
              <Descriptions.Item label="联系方式">18112345678</Descriptions.Item>
              <Descriptions.Item label="联系地址">曲丽丽 18100000000 浙江省杭州市西湖区万塘路18号</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <Descriptions column={2} title="信息组">
              <Descriptions.Item label="某某数据">725.00</Descriptions.Item>
              <Descriptions.Item label="该数据更新时间">2017-08-08</Descriptions.Item>
              <Descriptions.Item label="某某数据">725.00</Descriptions.Item>
              <Descriptions.Item label="该数据更新时间">2017-08-08</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 近半年来电记录 */}
          <Card title="用户近半年来电记录" style={{ marginBottom: 24 }}>
            <Empty description="近半年无来电记录" />
          </Card>

          {/* 操作日志 */}
          <Card
            tabList={operationTabList}
            activeTabKey={opKey}
            onTabChange={(key) => setOpKey(key as OperationKey)}
          >
            {contentList[opKey]}
          </Card>
        </GridContent>
      )}

      {tabKey === 'rule' && (
        <Card>
          <Descriptions title="退款规则" column={1}>
            <Descriptions.Item label="退款周期">收到货物后7天之内</Descriptions.Item>
            <Descriptions.Item label="退款条件">货物完好无损，包装完整</Descriptions.Item>
            <Descriptions.Item label="退款方式">原路退款</Descriptions.Item>
            <Descriptions.Item label="退款时效">审核通过后3-5个工作日</Descriptions.Item>
            <Descriptions.Item label="特殊说明">
              定制商品、虚拟商品等特殊商品不支持退款，具体以商品页面说明为准。
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </PageContainer>
  )
}

export default AdvancedProfilePage

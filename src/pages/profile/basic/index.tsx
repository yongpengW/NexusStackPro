import type { ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { Badge, Button, Card, Descriptions, Divider } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next'

interface BasicGood {
  id: string | number
  name?: string
  barcode?: string
  price?: string
  num: number
  amount: number
}

interface BasicProgress {
  time: string
  rate: string
  status: 'success' | 'processing'
  operator: string
  cost: string
}

const goodsData: BasicGood[] = [
  { id: '1234561', name: '矿泉水 550 ml', barcode: '12421432143214321', price: '2.00', num: 1, amount: 2.0 },
  { id: '1234562', name: 'Ant Design 可乐', barcode: '12421432143214322', price: '6.00', num: 2, amount: 12.0 },
  { id: '1234563', name: '袜子（来福牌）', barcode: '12421432143214323', price: '14.00', num: 4, amount: 56.0 },
]

const progressData: BasicProgress[] = [
  { time: '2017-10-01 14:10', rate: '联系客户', status: 'processing', operator: '取货员 ID1234', cost: '5mins' },
  { time: '2017-10-01 14:05', rate: '取货员出发', status: 'success', operator: '取货员 ID1234', cost: '1mins' },
  { time: '2017-10-01 13:05', rate: '取货员接单', status: 'success', operator: '取货员 ID1234', cost: '45mins' },
  { time: '2017-10-01 13:00', rate: '申请审批通过', status: 'success', operator: '系统', cost: '5mins' },
]

function ProfileBasicPage() {
  const { t } = useTranslation()
  const totalNum = goodsData.reduce((sum, item) => sum + item.num, 0)
  const totalAmount = goodsData.reduce((sum, item) => sum + item.amount, 0)

  const goodsColumns: ProColumns<BasicGood>[] = [
    {
      title: '商品编号',
      dataIndex: 'id',
      key: 'id',
      render: (text, _, idx) => {
        if (idx < goodsData.length) return <span>{text}</span>
        return { children: <span style={{ fontWeight: 600 }}>总计</span>, props: { colSpan: 4 } }
      },
    },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '商品条码', dataIndex: 'barcode', key: 'barcode' },
    { title: '单价', dataIndex: 'price', key: 'price', align: 'right' },
    {
      title: '数量（件）',
      dataIndex: 'num',
      key: 'num',
      align: 'right',
      render: (text, _, idx) =>
        idx < goodsData.length ? text : <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (text, _, idx) =>
        idx < goodsData.length ? `¥${text}` : <span style={{ fontWeight: 600 }}>¥{text}</span>,
    },
  ]

  const progressColumns: ProColumns<BasicProgress>[] = [
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '当前进度', dataIndex: 'rate', key: 'rate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) =>
        text === 'success' ? (
          <Badge status="success" text="成功" />
        ) : (
          <Badge status="processing" text="进行中" />
        ),
    },
    { title: '操作员ID', dataIndex: 'operator', key: 'operator' },
    { title: '耗时', dataIndex: 'cost', key: 'cost' },
  ]

  return (
    <PageContainer
      title={t('menu.profile.basic')}
      subTitle="基础详情展示了一个退款申请单的完整信息。"
    >
      <Card variant="borderless">
        <Descriptions title="退款申请" style={{ marginBottom: 32 }}>
          <Descriptions.Item label="取货单号">1000000000</Descriptions.Item>
          <Descriptions.Item label="状态">已取货</Descriptions.Item>
          <Descriptions.Item label="销售单号">1234123421</Descriptions.Item>
          <Descriptions.Item label="子订单">3214321432</Descriptions.Item>
        </Descriptions>

        <Divider style={{ marginBottom: 32 }} />

        <Descriptions title="用户信息" style={{ marginBottom: 32 }}>
          <Descriptions.Item label="用户姓名">付小小</Descriptions.Item>
          <Descriptions.Item label="联系电话">18100000000</Descriptions.Item>
          <Descriptions.Item label="常用快递">菜鸟仓储</Descriptions.Item>
          <Descriptions.Item label="取货地址">浙江省杭州市西湖区万塘路18号</Descriptions.Item>
          <Descriptions.Item label="备注">无</Descriptions.Item>
        </Descriptions>

        <Divider style={{ marginBottom: 32 }} />

        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>退货商品</span>
        </div>
        <ProTable<BasicGood>
          rowKey="id"
          search={false}
          toolBarRender={false}
          dataSource={[...goodsData, { id: '总计', num: totalNum, amount: totalAmount }]}
          columns={goodsColumns}
          pagination={false}
          style={{ marginBottom: 32 }}
        />

        <Divider style={{ marginBottom: 32 }} />

        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>退货进度</span>
        </div>
        <ProTable<BasicProgress>
          rowKey="time"
          search={false}
          toolBarRender={false}
          dataSource={progressData}
          columns={progressColumns}
          pagination={false}
        />

        <div style={{ marginTop: 32, textAlign: 'right' }}>
          <Button type="primary" style={{ marginRight: 8 }}>
            审核通过
          </Button>
          <Button danger>驳回</Button>
        </div>
      </Card>
    </PageContainer>
  )
}

export default ProfileBasicPage

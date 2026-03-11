import type { ActionType, ProColumns, ProDescriptionsItemProps } from '@ant-design/pro-components'
import {
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components'
import { Button, Drawer, Modal, App, Tag, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import React, { useRef, useState } from 'react'

/** 规则状态枚举 */
const StatusEnum = {
  0: { text: '关闭', status: 'Default', color: 'default' },
  1: { text: '运行中', status: 'Processing', color: 'processing' },
  2: { text: '已上线', status: 'Success', color: 'success' },
  3: { text: '异常', status: 'Error', color: 'error' },
} as const

type StatusKey = keyof typeof StatusEnum

export type RuleItem = {
  id: number
  name: string
  desc: string
  callNo: number
  status: StatusKey
  updatedAt: string
  createdAt: string
}

/** 生成随机 mock 数据 */
const generateMockData = (total = 50): RuleItem[] => {
  return Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    name: `规则 ${String(i + 1).padStart(3, '0')}`,
    desc: `这是第 ${i + 1} 条规则的描述信息，用于演示 ProTable 的使用`,
    callNo: Math.floor(Math.random() * 2000),
    status: (Math.floor(Math.random() * 4)) as StatusKey,
    updatedAt: new Date(Date.now() - Math.random() * 1e10).toLocaleDateString(),
    createdAt: new Date(Date.now() - Math.random() * 2e10).toLocaleDateString(),
  }))
}

const ALL_DATA = generateMockData(50)

const RuleListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null)
  const { modal, message } = App.useApp()

  const [showDetail, setShowDetail] = useState(false)
  const [currentRow, setCurrentRow] = useState<RuleItem | undefined>()
  const [selectedRows, setSelectedRows] = useState<RuleItem[]>([])
  const [createOpen, setCreateOpen] = useState(false)

  const handleDelete = (rows: RuleItem[]) => {
    modal.confirm({
      title: `确认删除 ${rows.length} 条规则？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        message.success(`已删除 ${rows.length} 条规则`)
        setSelectedRows([])
        actionRef.current?.clearSelected?.()
      },
    })
  }

  const columns: ProColumns<RuleItem>[] = [
    {
      title: '规则名称',
      dataIndex: 'name',
      render: (dom, entity) => (
        <a
          onClick={() => {
            setCurrentRow(entity)
            setShowDetail(true)
          }}
        >
          {dom}
        </a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'desc',
      valueType: 'textarea',
      ellipsis: true,
      search: false,
    },
    {
      title: '服务调用次数',
      dataIndex: 'callNo',
      sorter: true,
      search: false,
      renderText: (val: number) => `${val} 万`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInForm: true,
      valueEnum: Object.fromEntries(
        Object.entries(StatusEnum).map(([k, v]) => [k, { text: v.text, status: v.status }])
      ),
      render: (_, record) => {
        const s = StatusEnum[record.status]
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '上次调度时间',
      dataIndex: 'updatedAt',
      valueType: 'date',
      sorter: true,
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="config"
          onClick={() => {
            setCurrentRow(record)
            setShowDetail(true)
          }}
        >
          配置
        </a>,
        <a
          key="delete"
          style={{ color: '#ff4d4f' }}
          onClick={() => handleDelete([record])}
        >
          删除
        </a>,
      ],
    },
  ]

  const descriptionColumns: ProDescriptionsItemProps<RuleItem>[] = columns
    .filter((c) => c.dataIndex !== 'option')
    // ProTable 的列定义与 ProDescriptions 的 item 定义大体兼容，但类型并不完全一致
    // 这里做一次收敛转换，避免把 "option" 这种仅表格用的列传入详情描述组件
    .map((c) => c as unknown as ProDescriptionsItemProps<RuleItem>)

  return (
    <PageContainer>
      <ProTable<RuleItem>
        headerTitle="规则列表"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 120 }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            新建规则
          </Button>,
        ]}
        request={async (params) => {
          await new Promise((r) => setTimeout(r, 400))
          const { current = 1, pageSize = 10, name } = params
          const filtered = ALL_DATA.filter((item) =>
            name ? item.name.includes(name) : true
          )
          return {
            data: filtered.slice((current - 1) * pageSize, current * pageSize),
            total: filtered.length,
            success: true,
          }
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        pagination={{ pageSize: 10 }}
      />

      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={
            <span>
              已选择 <strong>{selectedRows.length}</strong> 项
            </span>
          }
        >
          <Space>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(selectedRows)}
            >
              批量删除
            </Button>
          </Space>
        </FooterToolbar>
      )}

      {/* 新建规则弹窗（占位） */}
      <Modal
        title="新建规则"
        open={createOpen}
        onOk={() => {
          message.success('新建成功！')
          setCreateOpen(false)
          actionRef.current?.reload()
        }}
        onCancel={() => setCreateOpen(false)}
        okText="提交"
        cancelText="取消"
      >
        <p>此处可嵌入表单，例如 ProForm。</p>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        width={500}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined)
          setShowDetail(false)
        }}
        title="规则详情"
      >
        {currentRow && (
          <ProDescriptions<RuleItem>
            column={1}
            dataSource={currentRow}
            columns={descriptionColumns}
          />
        )}
      </Drawer>
    </PageContainer>
  )
}

export default RuleListPage

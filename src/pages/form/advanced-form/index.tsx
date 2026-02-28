import { CloseCircleOutlined } from '@ant-design/icons'
import type { ProColumnType } from '@ant-design/pro-components'
import {
  EditableProTable,
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDateRangePicker,
  ProFormSelect,
  ProFormText,
  ProFormTimePicker,
} from '@ant-design/pro-components'
import { Card, Col, message, Popover, Row } from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface TableFormDateType {
  key: string
  workId?: string
  name?: string
  department?: string
  isNew?: boolean
  editable?: boolean
}

type InternalNamePath = (string | number)[]

const fieldLabels = {
  name: '仓库名称',
  url: '仓库域名',
  owner: '仓库管理员',
  approver: '审批人',
  dateRange: '生效日期',
  type: '仓库类型',
  name2: '任务名称',
  url2: '任务描述',
  owner2: '执行人',
  approver2: '责任人',
  dateRange2: '生效日期',
  type2: '任务类型',
}

const tableData: TableFormDateType[] = [
  { key: '1', workId: '00001', name: 'John Brown', department: 'New York No. 1 Lake Park' },
  { key: '2', workId: '00002', name: 'Jim Green', department: 'London No. 1 Lake Park' },
  { key: '3', workId: '00003', name: 'Joe Black', department: 'Sidney No. 1 Lake Park' },
]

interface ErrorField {
  name: InternalNamePath
  errors: string[]
}

const AdvancedFormPage: React.FC = () => {
  const { t } = useTranslation()
  const [error, setError] = useState<ErrorField[]>([])

  const getErrorInfo = (errFields: ErrorField[]) => {
    const contentList = Object.keys(fieldLabels).map((key) => {
      const fieldName = key as keyof typeof fieldLabels
      const fieldErrors = errFields.filter(
        (f) => f.name[0] === fieldName && f.errors.length > 0,
      )
      if (fieldErrors.length === 0) return null
      return (
        <li key={fieldName} style={{ marginBottom: 4 }}>
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          {fieldLabels[fieldName]}
          {fieldErrors[0].errors[0] ? ': ' + fieldErrors[0].errors[0] : ''}
        </li>
      )
    })
    return (
      <span>
        <Popover
          title="表单校验信息"
          content={<ul style={{ padding: '0 16px', margin: 0, listStyle: 'none' }}>{contentList}</ul>}
          overlayStyle={{ minWidth: 256 }}
        >
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
        </Popover>
        共 {errFields.length} 处错误信息
        {errFields[0]?.errors[0] ? ': ' + errFields[0]?.errors[0] : ''}
      </span>
    )
  }

  const onFinish = async (values: Record<string, unknown>) => {
    setError([])
    console.log('表单提交', values)
    message.success('提交成功')
  }

  const onFinishFailed = (errorInfo: { errorFields: { name: InternalNamePath; errors: string[] }[] }) => {
    setError(errorInfo.errorFields)
  }

  const columns: ProColumnType<TableFormDateType>[] = [
    { title: '工号', dataIndex: 'workId', key: 'workId', width: 80 },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      formItemProps: { rules: [{ required: true, message: '请输入姓名' }] },
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      formItemProps: { rules: [{ required: true, message: '请输入所属部门' }] },
    },
    {
      title: '操作',
      valueType: 'option',
      key: 'option',
      width: 80,
      render: (_, row, _idx, action) => [
        <a key="edit" onClick={() => action?.startEditable(row.key)}>编辑</a>,
      ],
    },
  ]

  return (
    <PageContainer title={t('menu.form.advanced-form')} content="高级表单常见于一次性输入和提交大批量数据的场景。">
      <ProForm
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed as never}
        submitter={{
          render: (_props, dom) => (
            <FooterToolbar>
              {error.length > 0 && (
                <span style={{ marginRight: 12, color: '#ff4d4f' }}>
                  {getErrorInfo(error)}
                </span>
              )}
              {dom}
            </FooterToolbar>
          ),
        }}
      >
        <Card title="仓库管理" variant="borderless" style={{ marginBottom: 32 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <ProFormText label={fieldLabels.name} name="name" rules={[{ required: true, message: '请输入仓库名称' }]} placeholder="请输入仓库名称" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormText label={fieldLabels.url} name="url" rules={[{ required: true, message: '请输入仓库域名' }]} addonBefore="http://" addonAfter=".com" placeholder="请输入" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormSelect label={fieldLabels.owner} name="owner" rules={[{ required: true, message: '请选择管理员' }]} options={[{ value: 'xiao', label: '付晓晓' },{ value: 'mao', label: '周毛毛' }]} placeholder="请选择" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormSelect label={fieldLabels.approver} name="approver" rules={[{ required: true, message: '请选择审批人' }]} options={[{ value: 'xiao', label: '付晓晓' },{ value: 'mao', label: '周毛毛' }]} placeholder="请选择" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormDateRangePicker label={fieldLabels.dateRange} name="dateRange" rules={[{ required: true, message: '请选择生效日期' }]} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormSelect label={fieldLabels.type} name="type" rules={[{ required: true, message: '请选择仓库类型' }]} options={[{ value: 'private', label: '私密' },{ value: 'public', label: '公开' }]} placeholder="请选择" />
            </Col>
          </Row>
        </Card>

        <Card title="任务管理" variant="borderless" style={{ marginBottom: 32 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <ProFormText label={fieldLabels.name2} name="name2" rules={[{ required: true, message: '请输入任务名称' }]} placeholder="请输入任务名称" />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <ProFormText label={fieldLabels.url2} name="url2" rules={[{ required: true, message: '请输入任务描述' }]} placeholder="请输入任务描述" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormSelect label={fieldLabels.owner2} name="owner2" rules={[{ required: true, message: '请选择执行人' }]} options={[{ value: 'xiao', label: '付晓晓' },{ value: 'mao', label: '周毛毛' }]} placeholder="请选择" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormSelect label={fieldLabels.approver2} name="approver2" rules={[{ required: true, message: '请选择责任人' }]} options={[{ value: 'xiao', label: '付晓晓' },{ value: 'mao', label: '周毛毛' }]} placeholder="请选择" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormDateRangePicker label={fieldLabels.dateRange2} name="dateRange2" rules={[{ required: true, message: '请选择生效日期' }]} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormTimePicker label="开始时间" name="startTime" placeholder="请选择" />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <ProFormSelect label={fieldLabels.type2} name="type2" rules={[{ required: true, message: '请选择任务类型' }]} options={[{ value: 'A', label: 'A 类' },{ value: 'B', label: 'B 类' },{ value: 'C', label: 'C 类' }]} placeholder="请选择" />
            </Col>
          </Row>
        </Card>

        <Card title="成员管理" variant="borderless" style={{ marginBottom: 32 }}>
          <EditableProTable<TableFormDateType>
            rowKey="key"
            name="members"
            columns={columns}
            defaultValue={tableData}
            recordCreatorProps={{
              record: () => ({ key: String(Date.now()), workId: '', name: '', department: '' }),
              creatorButtonText: '添加成员',
            }}
          />
        </Card>
      </ProForm>
    </PageContainer>
  )
}

export default AdvancedFormPage
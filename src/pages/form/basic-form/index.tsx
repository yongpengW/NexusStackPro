import {
  PageContainer,
  ProForm,
  ProFormDateRangePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components'
import { Card, message } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next'

const BasicFormPage: React.FC = () => {
  const { t } = useTranslation()
  const onFinish = async (values: Record<string, unknown>) => {
    console.log('提交数据', values)
    message.success('提交成功')
  }

  return (
    <PageContainer
      title={t('menu.form.basic-form')}
      content="表单页用于向用户收集或验证信息，基础表单常见于数据项较少的表单场景。"
    >
      <Card variant="borderless">
        <ProForm
          hideRequiredMark
          style={{ margin: 'auto', marginTop: 8, maxWidth: 600 }}
          name="basic"
          layout="vertical"
          initialValues={{ publicType: '1' }}
          onFinish={onFinish}
          submitter={{
            searchConfig: { submitText: '提交', resetText: '重置' },
          }}
        >
          <ProFormText
            width="md"
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
            placeholder="给目标起个名字"
          />
          <ProFormDateRangePicker
            label="起止日期"
            width="md"
            name="date"
            rules={[{ required: true, message: '请选择起止日期' }]}
            placeholder={['开始日期', '结束日期']}
          />
          <ProFormTextArea
            label="目标描述"
            width="xl"
            name="goal"
            rules={[{ required: true, message: '请输入目标描述' }]}
            placeholder="请输入你的阶段性工作目标"
            fieldProps={{ rows: 4 }}
          />
          <ProFormTextArea
            label="衡量标准"
            name="standard"
            width="xl"
            rules={[{ required: true, message: '请输入衡量标准' }]}
            placeholder="请输入衡量标准"
          />
          <ProFormText
            width="md"
            label={
              <span>
                客户
                <em style={{ fontStyle: 'normal', color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>
                  （选填）
                </em>
              </span>
            }
            tooltip="目标的服务对象"
            name="client"
            placeholder="请描述你服务的客户，内部客户直接 @姓名／工号"
          />
          <ProFormText
            width="md"
            label={
              <span>
                邀评人
                <em style={{ fontStyle: 'normal', color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>
                  （选填）
                </em>
              </span>
            }
            name="invites"
            placeholder="请直接 @姓名／工号，最多可邀请 5 人"
          />
          <ProFormDigit
            label={
              <span>
                权重
                <em style={{ fontStyle: 'normal', color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>
                  （选填）
                </em>
              </span>
            }
            name="weight"
            placeholder="请输入"
            min={0}
            max={100}
            width="xs"
            fieldProps={{
              formatter: (value) => `${value}%`,
              parser: (value) => Number(value ? value.replace('%', '') : '0'),
            }}
          />
          <ProFormRadio.Group
            options={[
              { value: '1', label: '公开' },
              { value: '2', label: '部分公开' },
              { value: '3', label: '不公开' },
            ]}
            label="目标公开"
            help="客户、邀评人默认被分组"
            name="publicType"
          />
          <ProFormDependency name={['publicType']}>
            {({ publicType }) => (
              <ProFormSelect
                width="md"
                name="publicUsers"
                label="可见人员"
                fieldProps={{
                  style: {
                    display: publicType === '2' ? 'block' : 'none',
                  },
                }}
                options={[
                  { value: '1', label: '同事甲' },
                  { value: '2', label: '同事乙' },
                  { value: '3', label: '同事丙' },
                ]}
                placeholder="请选择可见人员"
              />
            )}
          </ProFormDependency>
        </ProForm>
      </Card>
    </PageContainer>
  )
}

export default BasicFormPage
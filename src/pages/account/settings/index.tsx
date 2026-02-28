import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components'
import { Avatar, Divider, List, App } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  BellOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import React, { useState } from 'react'

const menuItems = [
  { key: 'profile', icon: <UserOutlined />, label: '基本资料' },
  { key: 'security', icon: <LockOutlined />, label: '安全设置' },
  { key: 'notify', icon: <BellOutlined />, label: '消息通知' },
  { key: 'binding', icon: <SafetyOutlined />, label: '账号绑定' },
]

const AccountSettingsPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState('profile')
  const { message } = App.useApp()

  return (
    <PageContainer title="账户设置">
      <ProCard ghost gutter={16}>
        {/* 侧边菜单 */}
        <ProCard
          colSpan={{ xs: 24, md: 5 }}
          bordered
          style={{ minHeight: 320 }}
        >
          <List
            dataSource={menuItems}
            renderItem={(item) => (
              <List.Item
                key={item.key}
                style={{
                  cursor: 'pointer',
                  padding: '12px 16px',
                  borderRadius: 6,
                  marginBottom: 4,
                  background: activeKey === item.key ? '#e6f4ff' : 'transparent',
                  color: activeKey === item.key ? '#1677ff' : 'inherit',
                  fontWeight: activeKey === item.key ? 600 : 400,
                }}
                onClick={() => setActiveKey(item.key)}
              >
                <List.Item.Meta
                  avatar={
                    <span
                      style={{
                        color: activeKey === item.key ? '#1677ff' : '#8c8c8c',
                      }}
                    >
                      {item.icon}
                    </span>
                  }
                  title={
                    <span
                      style={{
                        color: activeKey === item.key ? '#1677ff' : 'inherit',
                        fontWeight: activeKey === item.key ? 600 : 400,
                      }}
                    >
                      {item.label}
                    </span>
                  }
                />
              </List.Item>
            )}
            split={false}
          />
        </ProCard>

        {/* 右侧内容区 */}
        <ProCard colSpan={{ xs: 24, md: 19 }} bordered>
          {activeKey === 'profile' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                <Avatar size={80} icon={<UserOutlined />} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Admin User</div>
                  <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                    超级管理员 · 上次登录：2026-02-27 09:00
                  </div>
                </div>
              </div>
              <Divider />
              <ProForm
                onFinish={async () => {
                  await new Promise((r) => setTimeout(r, 600))
                  message.success('资料更新成功！')
                }}
                submitter={{ searchConfig: { submitText: '保存修改' } }}
                initialValues={{
                  nickname: 'Admin User',
                  email: 'admin@nexusstack.dev',
                  phone: '13800138000',
                  bio: '热爱技术，专注于企业级前端工程建设。',
                  region: 'Shanghai',
                }}
              >
                <ProForm.Group>
                  <ProFormText
                    name="nickname"
                    label="昵称"
                    width="md"
                    rules={[{ required: true, message: '请输入昵称' }]}
                  />
                  <ProFormText name="email" label="邮箱" width="md" />
                </ProForm.Group>
                <ProForm.Group>
                  <ProFormText name="phone" label="手机号" width="md" />
                  <ProFormSelect
                    name="region"
                    label="所在地区"
                    width="md"
                    options={[
                      { label: '上海', value: 'Shanghai' },
                      { label: '北京', value: 'Beijing' },
                      { label: '广州', value: 'Guangzhou' },
                      { label: '深圳', value: 'Shenzhen' },
                    ]}
                  />
                </ProForm.Group>
                <ProFormTextArea name="bio" label="个人简介" width="xl" />
              </ProForm>
            </>
          )}

          {activeKey === 'security' && (
            <ProForm
              onFinish={async () => {
                await new Promise((r) => setTimeout(r, 600))
                message.success('密码修改成功！')
              }}
              submitter={{ searchConfig: { submitText: '确认修改' } }}
            >
              <ProFormText.Password
                name="oldPassword"
                label="当前密码"
                width="md"
                rules={[{ required: true, message: '请输入当前密码' }]}
              />
              <ProFormText.Password
                name="newPassword"
                label="新密码"
                width="md"
                rules={[{ required: true, message: '请输入新密码' }, { min: 8, message: '密码至少 8 位' }]}
              />
              <ProFormText.Password
                name="confirmPassword"
                label="确认新密码"
                width="md"
                rules={[{ required: true, message: '请确认新密码' }]}
              />
            </ProForm>
          )}

          {activeKey === 'notify' && (
            <ProForm
              onFinish={async () => {
                await new Promise((r) => setTimeout(r, 400))
                message.success('通知设置已保存！')
              }}
              submitter={{ searchConfig: { submitText: '保存设置' } }}
              initialValues={{
                emailNotify: true,
                smsNotify: false,
                systemNotify: true,
                orderNotify: true,
              }}
            >
              <ProFormSwitch name="emailNotify" label="邮件通知" />
              <ProFormSwitch name="smsNotify" label="短信通知" />
              <ProFormSwitch name="systemNotify" label="系统消息" />
              <ProFormSwitch name="orderNotify" label="订单提醒" />
            </ProForm>
          )}

          {activeKey === 'binding' && (
            <List
              itemLayout="horizontal"
              dataSource={[
                { title: '绑定微信', desc: '未绑定', action: '去绑定', color: '#52c41a' },
                { title: '绑定支付宝', desc: '已绑定 13800138000', action: '解绑', color: '#ff4d4f' },
                { title: '绑定 GitHub', desc: '未绑定', action: '去绑定', color: '#52c41a' },
              ]}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a
                      key="action"
                      style={{ color: item.color }}
                      onClick={() => message.info(`${item.action}功能开发中`)}
                    >
                      {item.action}
                    </a>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={<span style={{ color: '#8c8c8c' }}>{item.desc}</span>}
                  />
                </List.Item>
              )}
            />
          )}
        </ProCard>
      </ProCard>
    </PageContainer>
  )
}

export default AccountSettingsPage

import {
  PageContainer,
  ProCard,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components'
import { Avatar, Divider, List, App, Spin, Form } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  BellOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { isBusinessError } from '@/utils/request'
import { UserApi, type CreateUserDto, type CurrentUserDto, Gender } from '@/services/user'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useMemo, useState } from 'react'
import { formatDateTime } from '@/utils/dateUtils'

const menuItems = [
  { key: 'profile', icon: <UserOutlined />, label: '基本资料' },
  { key: 'security', icon: <LockOutlined />, label: '修改密码' },
  { key: 'notify', icon: <BellOutlined />, label: '消息通知' },
  { key: 'binding', icon: <SafetyOutlined />, label: '账号绑定' },
]

function AccountSettingsPage() {
  const [activeKey, setActiveKey] = useState('profile')
  const { message } = App.useApp()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [me, setMe] = useState<CurrentUserDto | null>(null)
  const [profileForm] = Form.useForm<{
    userName: string
    realName?: string
    nickName?: string
    mobile: string
    email?: string
    gender?: Gender
    remark?: string
  }>()

  const genderOptions = useMemo(
    () => [
      { label: '未知', value: Gender.Unknown },
      { label: '男', value: Gender.Male },
      { label: '女', value: Gender.Female },
    ],
    [],
  )

  const meQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => UserApi.getMe(),
    enabled: activeKey === 'profile',
  })

  useEffect(() => {
    if (meQuery.data) setMe(meQuery.data)
  }, [meQuery.data])

  useEffect(() => {
    // 异步拿到 me 或保存后 setMe(fresh) 时，同步到表单
    if (activeKey !== 'profile' || !me) return
    profileForm.setFieldsValue({
      userName: me.userName,
      realName: me.realName,
      nickName: me.nickName,
      mobile: me.mobile,
      email: me.email,
      gender: me.gender ?? Gender.Unknown,
      remark: (me as CurrentUserDto & { remark?: string })?.remark ?? undefined,
    })
  }, [activeKey, me, profileForm])

  const updateMeMutation = useMutation({
    mutationFn: async (payload: CreateUserDto) => {
      if (!me) throw new Error('未获取到当前用户信息')
      await UserApi.update(me.id, payload)
    },
    onSuccess: () => {
      message.success('资料更新成功！')
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
    onError: (err: unknown) => {
      if (isBusinessError(err)) message.error(err.message ?? '保存失败')
    },
  })

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
              <Spin spinning={meQuery.isLoading}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                  <Avatar size={80} src={me?.avatar} icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>
                      {me?.realName || me?.nickName || me?.userName || '-'}
                    </div>
                    <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                      上次登录：{formatDateTime(me?.lastLoginTime)}
                    </div>
                  </div>
                </div>
                <Divider />
                {/* 仅在 me 就绪后渲染表单，使 initialValues 在挂载时即生效，避免 ProForm 的 async initialValues 警告 */}
                {me ? (
                  <ProForm<{
                    userName: string
                    realName?: string
                    nickName?: string
                    mobile: string
                    email?: string
                    gender?: Gender
                    remark?: string
                  }>
                    key={me.id}
                    form={profileForm}
                    initialValues={{
                      userName: me.userName,
                      realName: me.realName,
                      nickName: me.nickName,
                      mobile: me.mobile,
                      email: me.email,
                      gender: me.gender ?? Gender.Unknown,
                      remark: (me as CurrentUserDto & { remark?: string })?.remark ?? undefined,
                    }}
                    onFinish={async (values) => {
                      const payload: CreateUserDto = {
                        userName: me.userName,
                        realName: values.realName,
                        nickName: values.nickName,
                        mobile: values.mobile,
                        email: values.email,
                        gender: values.gender,
                        remark: values.remark,
                        isEnable: me.isEnable,
                        userRoles: (me.userRoles ?? []).map((r) => ({ roleId: r.roleId })),
                        departmentIds: (me.departments ?? []).map((d) => d.departmentId),
                      }
                      try {
                        await updateMeMutation.mutateAsync(payload)
                        const fresh = await queryClient.fetchQuery({
                          queryKey: ['user', 'me'],
                          queryFn: () => UserApi.getMe(),
                        })
                        setMe(fresh)
                        return true
                      } catch {
                        return false
                      }
                    }}
                    submitter={{
                      searchConfig: { submitText: '保存修改' },
                      submitButtonProps: { loading: updateMeMutation.isPending },
                    }}
                  >
                    <ProForm.Group>
                      <ProFormText name="userName" label="账号" width="md" disabled />
                      <ProFormText name="realName" label="真实姓名" width="md" />
                    </ProForm.Group>
                    <ProForm.Group>
                      <ProFormText
                        name="nickName"
                        label="昵称"
                        width="md"
                        rules={[{ required: true, message: '请输入昵称' }]}
                      />
                      <ProFormSelect
                        name="gender"
                        label="性别"
                        width="md"
                        options={genderOptions}
                      />
                    </ProForm.Group>
                    <ProForm.Group>
                      <ProFormText
                        name="mobile"
                        label="手机号"
                        width="md"
                        rules={[{ required: true, message: '请输入手机号' }]}
                      />
                      <ProFormText name="email" label="邮箱" width="md" />
                    </ProForm.Group>
                    <ProFormTextArea name="remark" label="个人简介" width="xl" />
                  </ProForm>
                ) : null}
              </Spin>
            </>
          )}

          {activeKey === 'security' && (
            <ProForm<{
              oldPassword: string
              newPassword: string
              confirmPassword: string
            }>
              onFinish={async ({ oldPassword, newPassword, confirmPassword }) => {
                if (newPassword !== confirmPassword) {
                  message.error('两次输入的密码不一致')
                  return false
                }
                try {
                  await UserApi.changePassword({ oldPassword, newPassword, confirmPassword })
                  message.success('密码修改成功，请使用新密码重新登录')
                  useAppStore.getState().logout()
                  navigate('/user/login')
                  return true
                } catch (error: unknown) {
                  if (isBusinessError(error)) message.error(error.message ?? '修改失败')
                  return false
                }
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
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少 6 位' },
                ]}
              />
              <ProFormText.Password
                name="confirmPassword"
                label="确认新密码"
                width="md"
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
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

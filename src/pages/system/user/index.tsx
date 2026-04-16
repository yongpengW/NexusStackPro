import { useRef, useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Dropdown, Space, Tag, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PlusOutlined, DownOutlined } from '@ant-design/icons'
import { PLATFORM_META, parsePlatformFlags } from '@/services/role'
import { RoleApi } from '@/services/role'
import type { SelectOptionDto as RoleSelectOptionDto } from '@/services/role'
import { RegionApi } from '@/services/region'
import { UserApi } from '@/services/user'
import type { UserDto } from '@/services/user'
import { useUser } from './useUser'
import { UserDrawer } from './UserDrawer'

export default function UserPage() {
  const actionRef = useRef<ActionType | null>(null)

  const { operatingId, handleEnable, handleDisable, handleResetPassword, handleDelete } =
    useUser(() => actionRef.current?.reload())

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)

  useEffect(() => {
    UserApi.getMe().then((me) => setCurrentUser(me)).catch(() => {
      // ignore
    })
  }, [])

  const openAdd = () => {
    setEditId(null)
    setDrawerOpen(true)
  }

  const openEdit = (id: string) => {
    setEditId(id)
    setDrawerOpen(true)
  }

  const isCurrentUser = (record: UserDto) => currentUser && record.id === currentUser.id

  const { data: regionList } = useQuery({
    queryKey: ['region', 'list'],
    queryFn: () => RegionApi.getList({}),
    staleTime: 5 * 60 * 1000,
  })
  const regionIdToName = useMemo(
    () => Object.fromEntries((regionList ?? []).map((r) => [r.id, r.name])),
    [regionList],
  )

  const columns: ProColumns<UserDto>[] = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 72,
      align: 'center',
      search: false,
      render: (_, record) => (
        <Avatar src={record.avatar}>
          {(record.realName || record.userName || '?').charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: '账号',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      search: false,
    },
    {
      title: '手机号',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'userRoles',
      key: 'userRoles',
      search: false,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.userRoles?.map((ur, urIndex) =>
            parsePlatformFlags(ur.platforms).map((p) => {
              const meta = PLATFORM_META[p]
              return meta ? (
                <Tag key={`${record.id}-${ur.roleId}-${p}-${urIndex}`} color={meta.color}>
                  {ur.roleName}
                </Tag>
              ) : null
            }),
          )}
        </Space>
      ),
    },
    {
      title: '所属组织',
      dataIndex: 'departments',
      key: 'departments',
      search: false,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.departments?.map((d) => (
            <Tag key={d.departmentId}>
              {regionIdToName[d.departmentId] ?? `#${d.departmentId}`}
            </Tag>
          ))}
          {(!record.departments || record.departments.length === 0) && '—'}
        </Space>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      width: 180,
      search: false,
      render: (_, record) => (record.lastLoginTime ? new Date(record.lastLoginTime).toLocaleString() : '—'),
    },
    {
      title: '状态',
      dataIndex: 'isEnable',
      key: 'isEnable',
      width: 80,
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isEnable ? 'success' : 'default'}>
          {record.isEnable ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '角色筛选',
      dataIndex: 'roleId',
      key: 'roleId',
      hideInTable: true,
      fieldProps: {
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
      },
      request: async () => {
        const list = await RoleApi.getSelector()
        return (list as RoleSelectOptionDto[]).map((r) => ({
          label: r.label,
          value: r.value,
        }))
      },
    },
    {
      title: '状态筛选',
      dataIndex: 'isEnable',
      key: 'isEnableSearch',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        true: { text: '启用' },
        false: { text: '禁用' },
      },
    },
    {
      title: '操作',
      key: 'action',
      search: false,
      width: 260,
      render: (_, record) => {
        const isSelf = isCurrentUser(record)
        const isOperating = operatingId === record.id
        const selfTooltip = '无法操作当前登录用户'

        const moreItems: MenuProps['items'] = [
          record.isEnable
            ? {
                key: 'disable',
                label: isSelf ? (
                  <Tooltip title={selfTooltip}>
                    <span>禁用</span>
                  </Tooltip>
                ) : (
                  '禁用'
                ),
                disabled: !!isSelf,
                onClick: isSelf ? undefined : () => handleDisable(record),
              }
            : {
                key: 'enable',
                label: isSelf ? (
                  <Tooltip title={selfTooltip}>
                    <span>启用</span>
                  </Tooltip>
                ) : (
                  '启用'
                ),
                disabled: !!isSelf,
                onClick: isSelf ? undefined : () => handleEnable(record.id),
              },
          {
            key: 'reset',
            label: isSelf ? (
              <Tooltip title={selfTooltip}>
                <span>重置密码</span>
              </Tooltip>
            ) : (
              '重置密码'
            ),
            disabled: !!isSelf,
            onClick: isSelf ? undefined : () => handleResetPassword(record),
          },
          {
            key: 'delete',
            label: isSelf ? (
              <Tooltip title={selfTooltip}>
                <span style={{ pointerEvents: 'all', cursor: 'not-allowed' }}>删除</span>
              </Tooltip>
            ) : (
              '删除'
            ),
            danger: !isSelf,
            disabled: !!isSelf,
            onClick: isSelf ? undefined : () => handleDelete(record),
          },
        ]

        return (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => openEdit(record.id)}>
              编辑
            </Button>
            <Dropdown menu={{ items: moreItems }} trigger={['click']} placement="bottomRight">
              <Button
                type="link"
                size="small"
                loading={isOperating}
                icon={<DownOutlined />}
              >
                更多
              </Button>
            </Dropdown>
          </Space>
        )
      },
    },
  ]

  return (
    <PageContainer title="用户管理">
      <ProTable<UserDto>
          headerTitle="用户列表"
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={{ labelWidth: 'auto' }}
          toolBarRender={() => [
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAdd}
            >
              新增用户
            </Button>,
          ]}
          request={async (params) => {
            const { current, pageSize, userName, mobile, email, roleId, isEnable } = params
            const result = await UserApi.getList({
              page: current ?? 1,
              limit: pageSize ?? 10,
              userName: userName as string | undefined,
              mobile: mobile as string | undefined,
              email: email as string | undefined,
              roleId: roleId != null && roleId !== '' ? String(roleId) : undefined,
              isEnable:
                isEnable === 'true'
                  ? true
                  : isEnable === 'false'
                  ? false
                  : (isEnable as boolean | undefined),
            })
            return { data: result.items, total: result.total, success: true }
          }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        />

      <UserDrawer
        open={drawerOpen}
        editId={editId}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          setDrawerOpen(false)
          actionRef.current?.reload()
        }}
      />
    </PageContainer>
  )
}


import { useRef, useState, useEffect } from 'react'
import { Button, Dropdown, Radio, Space, Tag, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { PlusOutlined, DownOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { useNavigate } from 'react-router-dom'
import { RoleApi, PLATFORM_META, parsePlatformFlags, PlatformType } from '@/services/role'
import type { RoleDto } from '@/services/role'
import { useRole } from './useRole'
import { RoleDrawer } from './RoleDrawer'

// ─── 平台筛选 Tab 配置 ────────────────────────────────────────────────────────

const PLATFORM_TABS = [
  { value: PlatformType.All,     label: '全部' },
  { value: PlatformType.Admin,   label: '超管' },
  { value: PlatformType.Pc,      label: 'PC端' },
  { value: PlatformType.Mini,    label: '小程序' },
  { value: PlatformType.Android, label: 'App' },
]

// ─── Page Component ───────────────────────────────────────────────────────────

export default function RolePage() {
  const actionRef = useRef<ActionType | null>(null)
  const navigate = useNavigate()

  // ─── 平台筛选（用 ref 保证 request 内始终读到最新值，避免切换 Tab 时闭包陈旧） ─
  const [platformType, setPlatformType] = useState<number>(PlatformType.All)
  const platformTypeRef = useRef(platformType)
  useEffect(() => {
    platformTypeRef.current = platformType
  }, [platformType])

  const handlePlatformChange = (value: number) => {
    setPlatformType(value)
    actionRef.current?.reload()
  }

  // ─── 操作逻辑（enable / disable / delete） ────────────────────────────
  const { operatingId, handleEnable, handleDisable, handleDelete } = useRole(
    () => actionRef.current?.reload(),
  )

  // ─── Drawer 状态 ─────────────────────────────────────────────────────
  const [roleDrawerOpen,  setRoleDrawerOpen]  = useState(false)
  const [editId,          setEditId]          = useState<number | null>(null)

  const openAddDrawer  = () => { setEditId(null); setRoleDrawerOpen(true) }
  const openEditDrawer = (id: number) => { setEditId(id); setRoleDrawerOpen(true) }

  const openPermissionPage = (record: RoleDto) => {
    // 当平台筛选为“全部”时，从角色自身平台 Flags 中选择一个作为默认平台
    let targetPlatform: PlatformType
    if (platformTypeRef.current === PlatformType.All) {
      const platforms = parsePlatformFlags(record.platforms)
      targetPlatform = (platforms[0] as PlatformType | undefined) ?? PlatformType.Admin
    } else {
      targetPlatform = platformTypeRef.current as PlatformType
    }
    navigate(`/system/permission?roleId=${record.id}&platform=${targetPlatform}`)
  }

  // ─── 列定义 ───────────────────────────────────────────────────────────

  const columns: ProColumns<RoleDto>[] = [
    {
      title:     '角色名称',
      dataIndex: 'name',
      key:       'name',
    },
    {
      title:     'Code',
      dataIndex: 'code',
      key:       'code',
      search:    false,
    },
    {
      title:     '所属平台',
      dataIndex: 'platforms',
      key:       'platforms',
      search:    false,
      render: (_, record) => (
        <Space size={4} wrap>
          {parsePlatformFlags(record.platforms).map((p) => {
            const meta = PLATFORM_META[p]
            return meta ? (
              <Tag key={p} color={meta.color}>{meta.label}</Tag>
            ) : null
          })}
        </Space>
      ),
    },
    {
      title:     '排序',
      dataIndex: 'order',
      key:       'order',
      width:     70,
      search:    false,
    },
    {
      title:     '系统角色',
      dataIndex: 'isSystem',
      key:       'isSystem',
      width:     90,
      search:    false,
      render: (_, record) =>
        record.isSystem ? (
          <Tag color="orange" icon={<SafetyCertificateOutlined />}>
            系统
          </Tag>
        ) : null,
    },
    {
      title:     '状态',
      dataIndex: 'isEnable',
      key:       'isEnable',
      width:     80,
      valueEnum: {
        true:  { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.isEnable ? 'success' : 'default'}>
          {record.isEnable ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title:     '关键词',
      dataIndex: 'keyword',
      key:       'keyword',
      hideInTable: true,
    },
    {
      title:     '操作',
      key:       'action',
      search:    false,
      width:     220,
      render: (_, record) => {
        const isSystem    = record.isSystem
        const isOperating = operatingId === record.id
        const sysTooltip  = '系统内置角色不可操作'

        const moreItems: MenuProps['items'] = [
          record.isEnable
            ? {
                key:     'disable',
                label:   isSystem ? (
                  <Tooltip title={sysTooltip}><span>禁用</span></Tooltip>
                ) : '禁用',
                danger:    !isSystem,
                disabled:  isSystem,
                onClick:   isSystem ? undefined : () => handleDisable(record),
              }
            : {
                key:     'enable',
                label:   isSystem ? (
                  <Tooltip title={sysTooltip}><span>启用</span></Tooltip>
                ) : '启用',
                disabled: isSystem,
                onClick:  isSystem ? undefined : () => handleEnable(record.id),
              },
          { type: 'divider' },
          {
            key:     'delete',
            label:   isSystem ? (
              <Tooltip title={sysTooltip}>
                <span style={{ pointerEvents: 'all', cursor: 'not-allowed' }}>删除</span>
              </Tooltip>
            ) : '删除',
            danger:   !isSystem,
            disabled:  isSystem,
            onClick:   isSystem ? undefined : () => handleDelete(record),
          },
        ]

        return (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => openPermissionPage(record)}>
              配置权限
            </Button>
            <Button type="link" size="small" onClick={() => openEditDrawer(record.id)}>
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

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <PageContainer title="角色管理">
      {/* 平台筛选 */}
      <Radio.Group
        value={platformType}
        onChange={(e) => handlePlatformChange(e.target.value as number)}
        optionType="button"
        buttonStyle="solid"
        style={{ marginBottom: 16 }}
      >
        {PLATFORM_TABS.map((t) => (
          <Radio.Button key={t.value} value={t.value}>
            {t.label}
          </Radio.Button>
        ))}
      </Radio.Group>

      {/* 角色列表 */}
      <ProTable<RoleDto>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddDrawer}
          >
            新增角色
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, keyword, isEnable } = params
          const result = await RoleApi.getList(platformTypeRef.current, {
            page:    current ?? 1,
            limit:   pageSize ?? 10,
            keyword: keyword as string | undefined,
            isEnable: isEnable === 'true'   ? true
                    : isEnable === 'false'  ? false
                    : (isEnable as boolean | undefined),
          })
          return { data: result.items, total: result.total, success: true }
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        rowClassName={(record) => (!record.isEnable ? 'ant-table-row-disabled' : '')}
        onRow={(record) => ({
          style: !record.isEnable ? { opacity: 0.55 } : undefined,
        })}
      />

      {/* 新增 / 编辑 Drawer */}
      <RoleDrawer
        open={roleDrawerOpen}
        editId={editId}
        onClose={() => {
          setRoleDrawerOpen(false)
          actionRef.current?.reload()
        }}
        onSuccess={() => {
          setRoleDrawerOpen(false)
          actionRef.current?.reload()
        }}
      />
    </PageContainer>
  )
}

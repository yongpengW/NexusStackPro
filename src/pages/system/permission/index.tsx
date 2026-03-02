import { App, Layout, Radio, Space } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import { PLATFORM_META, PlatformType } from '@/services/role'
import { usePermission } from './usePermission'
import { RolePanel } from './RolePanel'
import { PermissionTree } from './PermissionTree'

const { Sider, Content } = Layout

const PLATFORM_TABS = [
  { value: PlatformType.Admin, label: '超管' },
  { value: PlatformType.Pc, label: 'PC端' },
  { value: PlatformType.Mini, label: '小程序' },
  { value: PlatformType.Android, label: 'App' },
]

export default function PermissionPage() {
  const { modal } = App.useApp()
  const perm = usePermission()

  const handlePlatformChange = (next: PlatformType) => {
    if (next === perm.platformType) return
    if (!perm.isDirty) {
      void perm.changePlatform(next)
      return
    }
    modal.confirm({
      title: '切换平台',
      content: '当前角色权限尚未保存，切换后将丢失修改，确认切换？',
      okText: '确认切换',
      cancelText: '取消',
      onOk: () => perm.changePlatform(next),
    })
  }

  const handleSelectRole = (roleId: number) => {
    if (roleId === perm.selectedRoleId) return
    if (!perm.isDirty) {
      void perm.changeRole(roleId)
      return
    }
    modal.confirm({
      title: '切换角色',
      content: '当前角色权限尚未保存，切换后将丢失修改，确认切换？',
      okText: '确认切换',
      cancelText: '取消',
      onOk: () => perm.changeRole(roleId),
    })
  }

  const platformMeta = PLATFORM_META[perm.platformType]
  const platformLabel = platformMeta?.label ?? `平台${perm.platformType}`
  const platformColor = platformMeta?.color ?? 'default'

  return (
    <PageContainer
      title="权限管理"
      extra={
        <Space>
          <Radio.Group
            value={perm.platformType}
            onChange={(e) => handlePlatformChange(e.target.value as PlatformType)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            {PLATFORM_TABS.map((t) => (
              <Radio.Button key={t.value} value={t.value}>
                {t.label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Space>
      }
    >
      <Layout
        style={{
          background: 'transparent',
          minHeight: 480,
          border: '1px solid var(--ant-color-border-secondary)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Sider
          width={240}
          style={{
            background: 'var(--ant-color-bg-container)',
            borderRight: '1px solid var(--ant-color-border-secondary)',
          }}
        >
          <RolePanel
            roles={perm.roleList}
            selectedRoleId={perm.selectedRoleId}
            loading={perm.loadingRoles}
            onSelectRole={handleSelectRole}
          />
        </Sider>
        <Content
          style={{
            padding: 16,
            background: 'var(--ant-color-bg-layout)',
          }}
        >
          <PermissionTree
            platformLabel={platformLabel}
            platformColor={platformColor}
            roleName={perm.selectedRole?.name}
            isSystemRole={perm.isSystemRole}
            loading={perm.loadingRoles || perm.loadingPermissions}
            saving={perm.saving}
            permissionTree={perm.permissionTree}
            checkedKeys={perm.checkedKeys}
            dataRangeMap={perm.dataRangeMap}
            expandedApiBindings={perm.expandedApiBindings}
            onCheckChange={perm.updateCheckState}
            onDataRangeChange={perm.updateDataRange}
            onCheckAll={perm.checkAll}
            onClearAll={perm.clearAll}
            onSave={perm.save}
            loadApiBindings={perm.loadApiBindings}
          />
        </Content>
      </Layout>
    </PageContainer>
  )
}


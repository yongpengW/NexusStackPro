import { useState } from 'react'
import { App, Card, Empty, Radio } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import { useSearchParams } from 'react-router-dom'
import { PLATFORM_META, PlatformType } from '@/services/role'
import { usePermission } from './usePermission'
import { RolePanel } from './RolePanel'
import { PermissionTree } from './PermissionTree'

const PLATFORM_TABS = [
  { value: PlatformType.Admin, label: '超管' },
  { value: PlatformType.Pc, label: 'PC端' },
  { value: PlatformType.Mini, label: '小程序' },
  { value: PlatformType.Android, label: 'App' },
]

export default function PermissionPage() {
  const { modal } = App.useApp()
  const [searchParams] = useSearchParams()
  const [roleKeyword, setRoleKeyword] = useState('')

  const roleIdParam = searchParams.get('roleId')
  const platformParam = searchParams.get('platform')

  const initialRoleId = roleIdParam ? Number(roleIdParam) || undefined : undefined
  const platformValue = platformParam ? Number(platformParam) : NaN
  const validPlatforms = [PlatformType.Admin, PlatformType.Pc, PlatformType.Mini, PlatformType.Android]
  const initialPlatformType =
    validPlatforms.includes(platformValue as PlatformType) ? (platformValue as PlatformType) : undefined

  const perm = usePermission({ platformType: initialPlatformType, roleId: initialRoleId })

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
    <PageContainer title="权限管理">
      {/* 顶部：平台筛选 */}
      <Radio.Group
        value={perm.platformType}
        onChange={(e) => handlePlatformChange(e.target.value as PlatformType)}
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

      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        {/* 左侧：角色列表 */}
        <div style={{ width: 300, minWidth: 260 }}>
          <Card
            title="角色列表"
            size="small"
            styles={{
              body: {
                padding: 0,
                maxHeight: 520,
                overflow: 'auto',
              },
            }}
          >
            <RolePanel
              roles={perm.roleList}
              selectedRoleId={perm.selectedRoleId}
              loading={perm.loadingRoles}
              onSelectRole={handleSelectRole}
              keyword={roleKeyword}
              onKeywordChange={setRoleKeyword}
            />
          </Card>
        </div>

        {/* 右侧：权限配置 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card
            title="权限配置"
            size="small"
            styles={{
              body: {
                padding: 12,
                minHeight: 420,
              },
            }}
          >
            {!perm.loadingRoles && !perm.roleList.length ? (
              <Empty description="该平台暂无角色，请先在角色管理中创建" />
            ) : (
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
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}


import { useEffect, useMemo } from 'react'
import { Input, List, Space, Tag, Typography, Empty } from 'antd'
import { SearchOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import type { RoleDto } from '@/services/role'
import { PLATFORM_META, parsePlatformFlags } from '@/services/role'

const { Text } = Typography

interface RolePanelProps {
  roles: RoleDto[]
  selectedRoleId: number | null
  loading: boolean
  onSelectRole: (roleId: number) => void
  keyword: string
  onKeywordChange: (value: string) => void
}

export function RolePanel({
  roles,
  selectedRoleId,
  loading,
  onSelectRole,
  keyword,
  onKeywordChange,
}: RolePanelProps) {
  // 平台切换时 roles 引用变化，清空旧搜索词避免跨平台残留过滤
  useEffect(() => {
    onKeywordChange('')
  }, [roles, onKeywordChange])

  const filteredRoles = useMemo(() => {
    if (!keyword.trim()) return roles
    const lower = keyword.trim().toLowerCase()
    return roles.filter((r) => {
      const name = r.name?.toLowerCase() ?? ''
      const code = r.code?.toLowerCase() ?? ''
      return name.includes(lower) || code.includes(lower)
    })
  }, [roles, keyword])

  const renderPlatforms = (role: RoleDto) => {
    const platforms = parsePlatformFlags(role.platforms)
    if (!platforms.length) return null
    return (
      <Space size={4} wrap>
        {platforms.map((p) => {
          const meta = PLATFORM_META[p]
          return meta ? (
            <Tag key={p} color={meta.color} bordered={false} style={{ fontSize: 11 }}>
              {meta.label}
            </Tag>
          ) : null
        })}
      </Space>
    )
  }

  if (!loading && !roles.length) {
    return (
      <div style={{ padding: 16 }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="该平台暂无角色，请先在角色管理中创建"
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Input
        allowClear
        size="middle"
        placeholder="搜索角色名称 / Code"
        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        style={{
          margin: '8px 12px 4px',
          width: 'calc(100% - 24px)',
        }}
      />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 12px 8px',
        }}
      >
        {!loading && keyword.trim() && !filteredRoles.length && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="无匹配角色"
            style={{ marginTop: 24 }}
          />
        )}
        <List<RoleDto>
          size="small"
          loading={loading}
          dataSource={filteredRoles}
          rowKey="id"
          renderItem={(item) => {
            const isActive = item.id === selectedRoleId
            const isSystem = item.isSystem
            return (
              <List.Item
                style={{
                  cursor: 'pointer',
                  padding: '6px 8px',
                  borderRadius: 4,
                  marginBottom: 4,
                  background: isActive ? 'var(--ant-color-primary-bg-hover)' : undefined,
                  border: isActive
                    ? `1px solid var(--ant-color-primary-border)`
                    : '1px solid transparent',
                }}
                onClick={() => onSelectRole(item.id)}
              >
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Space size={6} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space size={6}>
                      <Text strong ellipsis style={{ maxWidth: 120 }}>
                        {item.name}
                      </Text>
                      {isSystem && (
                        <Tag
                          color="orange"
                          icon={<SafetyCertificateOutlined />}
                          style={{ paddingInline: 4 }}
                          bordered={false}
                        >
                          系统
                        </Tag>
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.code}
                    </Text>
                  </Space>
                  {renderPlatforms(item)}
                </Space>
              </List.Item>
            )
          }}
        />
      </div>
    </div>
  )
}


import { useState, useEffect } from 'react'
import {
  App,
  Alert,
  Button,
  Checkbox,
  Drawer,
  Form,
  Input,
  InputNumber,
  Space,
  Spin,
  Switch,
  Tag,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RoleApi,
  PLATFORM_OPTIONS,
  composePlatformFlags,
  parsePlatformFlags,
} from '@/services/role'
import { ROLE_QUERY_KEYS } from './useRole'
import type { CreateRoleDto, RoleDto } from '@/services/role'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RoleDrawerProps {
  open: boolean
  editId?: number | null
  onClose: () => void
  onSuccess: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RoleDrawer({ open, editId, onClose, onSuccess }: RoleDrawerProps) {
  const isEdit    = editId != null
  const [form]    = Form.useForm<CreateRoleDto & { platformsArr: number[] }>()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─── 编辑时获取详情 ───────────────────────────────────────────────────
  const detailQuery = useQuery({
    queryKey: ROLE_QUERY_KEYS.detail(editId ?? 0),
    queryFn:  () => RoleApi.getById(editId!),
    enabled:  isEdit && open,
  })

  const detail: RoleDto | undefined = detailQuery.data
  const isSystem = isEdit && !!detail?.isSystem

  // ─── 表单回填 ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      form.resetFields()
      setErrorMsg(null)
      return
    }
  }, [open, form])

  useEffect(() => {
    if (isEdit && open && detail) {
      if (detail.id !== editId) return
      form.setFieldsValue({
        ...detail,
        platformsArr: parsePlatformFlags(detail.platforms),
      })
    } else if (!isEdit && open) {
      form.setFieldsValue({
        name: undefined,
        code: undefined,
        remark: undefined,
        isEnable: true,
        order: 0,
        platformsArr: [],
      })
    }
  }, [isEdit, open, detail, editId, form])

  // ─── Mutations ────────────────────────────────────────────────────────

  const handleMutationSuccess = (msg: string) => {
    message.success(msg)
    queryClient.invalidateQueries({ queryKey: ROLE_QUERY_KEYS.detail(editId ?? 0) })
    onSuccess()
  }
  const handleMutationError = (err: Error) => setErrorMsg(err.message ?? '操作失败')

  const createMutation = useMutation({
    mutationFn: (data: CreateRoleDto) => RoleApi.create(data),
    onSuccess:  () => handleMutationSuccess('角色创建成功'),
    onError:    handleMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateRoleDto) => RoleApi.update(editId!, data),
    onSuccess:  () => handleMutationSuccess('保存成功'),
    onError:    handleMutationError,
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  // ─── 提交 ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setErrorMsg(null)
    try {
      const values = await form.validateFields()
      const { platformsArr, ...rest } = values as CreateRoleDto & { platformsArr?: number[] }
      const payload: CreateRoleDto = {
        ...rest,
        platforms: composePlatformFlags(platformsArr ?? []),
        isSystem:  false,
      }
      if (isEdit) {
        updateMutation.mutate(payload)
      } else {
        createMutation.mutate(payload)
      }
    } catch {
      // form validation errors shown inline
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────

  const drawerTitle = isEdit ? (isSystem ? '查看角色（系统内置）' : '编辑角色') : '新增角色'

  const footer = isSystem ? (
    <div style={{ textAlign: 'right' }}>
      <Button onClick={onClose}>关闭</Button>
    </div>
  ) : (
    <div style={{ textAlign: 'right' }}>
      <Space>
        <Button onClick={onClose}>取消</Button>
        <Button type="primary" loading={submitting} onClick={handleSubmit}>
          确认提交
        </Button>
      </Space>
    </div>
  )

  return (
    <Drawer
      title={drawerTitle}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={footer}
    >
      <Spin spinning={isEdit && detailQuery.isLoading}>
        {isSystem && (
          <Alert
            message="系统内置角色，核心属性不可修改"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setErrorMsg(null)}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          initialValues={{ isEnable: true, order: 0, platformsArr: [] }}
        >
          <Form.Item
            label="角色名称"
            name="name"
            rules={[
              { required: true, message: '角色名称不能为空' },
              { max: 64,        message: '最多 64 个字符' },
            ]}
          >
            <Input
              placeholder="请输入角色名称"
              maxLength={64}
              showCount
              disabled={isSystem}
            />
          </Form.Item>

          <Form.Item
            label="角色 Code"
            name="code"
            rules={[
              { required: true, message: '角色代码不能为空' },
              { max: 64,        message: '最多 64 个字符' },
            ]}
          >
            <Input
              placeholder="建议英文下划线，如 pc_ops"
              maxLength={64}
              showCount
              disabled={isSystem}
            />
          </Form.Item>

          <Form.Item
            label="所属平台"
            name="platformsArr"
            rules={[
              {
                validator: (_, value: number[]) =>
                  value?.length
                    ? Promise.resolve()
                    : Promise.reject(new Error('请选择所属平台')),
              },
            ]}
          >
            <Checkbox.Group disabled={isSystem}>
              <Space wrap>
                {PLATFORM_OPTIONS.map((p) => (
                  <Checkbox key={p.value} value={p.value}>
                    <Tag color={p.color}>{p.label}</Tag>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            label="排序"
            name="order"
            rules={[{ required: true, message: '请输入有效的排序值' }]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
              placeholder="数值越小越靠前"
              disabled={isSystem}
            />
          </Form.Item>

          <Form.Item label="是否启用" name="isEnable" valuePropName="checked">
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
              disabled={isSystem}
            />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea
              rows={3}
              maxLength={512}
              showCount
              placeholder="可选"
              disabled={isSystem}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  )
}

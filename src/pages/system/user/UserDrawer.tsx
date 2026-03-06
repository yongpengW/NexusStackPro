import { useState, useEffect } from 'react'
import {
  App,
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  TreeSelect,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isBusinessError } from '@/utils/request'
import { UserApi, Gender, type CreateUserDto, type UserDto } from '@/services/user'
import { RoleApi, type SelectOptionDto as RoleSelectOptionDto } from '@/services/role'
import { RegionApi, type SelectOptionDto as RegionSelectOptionDto } from '@/services/region'

interface UserDrawerProps {
  open: boolean
  editId: number | null
  onClose: () => void
  onSuccess: () => void
}

export function UserDrawer({ open, editId, onClose, onSuccess }: UserDrawerProps) {
  const isEdit = editId != null
  const [form] = Form.useForm<CreateUserDto & { roleIds: number[]; departmentIds: number[] }>()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const roleSelectorQuery = useQuery({
    queryKey: ['user', 'role-selector'],
    queryFn: () => RoleApi.getSelector(),
    enabled: open,
    staleTime: 60 * 1000,
  })

  const regionSelectorQuery = useQuery({
    queryKey: ['user', 'region-selector'],
    queryFn: () => RegionApi.getTreeSelector(),
    enabled: open,
    staleTime: 60 * 1000,
  })

  const detailQuery = useQuery({
    queryKey: ['user', 'detail', editId ?? 0],
    queryFn: () => UserApi.getById(editId!),
    enabled: isEdit && open,
  })

  const detail: UserDto | undefined = detailQuery.data

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setErrorMsg(null)
    }
  }, [open, form])

  useEffect(() => {
    if (isEdit && open && detail && detail.id === editId) {
      form.setFieldsValue({
        userName: detail.userName,
        realName: detail.realName,
        nickName: detail.nickName,
        mobile: detail.mobile,
        email: detail.email,
        gender: detail.gender,
        isEnable: detail.isEnable,
        remark: undefined,
        roleIds: detail.userRoles?.map((r) => r.roleId) ?? [],
        departmentIds: detail.departments?.map((d) => d.departmentId) ?? [],
      } as Partial<CreateUserDto & { roleIds: number[]; departmentIds: number[] }>)
    } else if (!isEdit && open) {
      form.setFieldsValue({
        userName: undefined,
        realName: undefined,
        nickName: undefined,
        mobile: undefined,
        email: undefined,
        gender: Gender.Unknown,
        isEnable: true,
        remark: undefined,
        roleIds: [],
        departmentIds: [],
      } as Partial<CreateUserDto & { roleIds: number[]; departmentIds: number[] }>)
    }
  }, [isEdit, open, detail, editId, form])

  const handleSuccess = (msg: string) => {
    message.success(msg)
    queryClient.invalidateQueries({ queryKey: ['user'] })
    onSuccess()
  }

  const handleError = (err: Error) => {
    if (isBusinessError(err)) setErrorMsg(err.message ?? '操作失败')
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => UserApi.create(data),
    onSuccess: () => handleSuccess('用户创建成功，初始密码为手机号后6位'),
    onError: handleError,
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateUserDto) => UserApi.update(editId!, data),
    onSuccess: () => handleSuccess('保存成功'),
    onError: handleError,
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async () => {
    setErrorMsg(null)
    try {
      const values = await form.validateFields()
      const { roleIds, departmentIds, ...rest } = values as CreateUserDto & {
        roleIds: number[]
        departmentIds: number[]
      }
      const payload: CreateUserDto = {
        ...rest,
        isEnable: rest.isEnable ?? true,
        userRoles: (roleIds ?? []).map((id) => ({ roleId: id })),
        departmentIds: departmentIds ?? [],
      }
      if (payload.userRoles.length === 0) {
        message.error('请为用户选择角色')
        return
      }
      if (isEdit) updateMutation.mutate(payload)
      else createMutation.mutate(payload)
    } catch {
      // 表单校验错误已在控件上展示
    }
  }

  const roleOptions =
    (roleSelectorQuery.data as RoleSelectOptionDto[] | undefined)?.map((r) => ({
      label: r.label,
      value: r.value,
    })) ?? []

  const departmentTree =
    (regionSelectorQuery.data as RegionSelectOptionDto[] | undefined) ?? []

  const title = isEdit ? '编辑用户' : '新增用户'

  return (
    <Drawer
      title={title}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" loading={submitting} onClick={handleSubmit}>
              确认提交
            </Button>
          </Space>
        </div>
      }
    >
      <Spin spinning={isEdit && detailQuery.isLoading}>
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
          initialValues={{
            gender: Gender.Unknown,
            isEnable: true,
            roleIds: [],
            departmentIds: [],
          }}
        >
          <Form.Item
            label="账号"
            name="userName"
            rules={[
              { required: true, message: '账号不能为空' },
              { max: 64, message: '最多 64 个字符' },
            ]}
          >
            <Input placeholder="请输入账号" maxLength={64} showCount />
          </Form.Item>

          <Form.Item
            label="真实姓名"
            name="realName"
            rules={[{ max: 64, message: '最多 64 个字符' }]}
          >
            <Input placeholder="可选" maxLength={64} showCount />
          </Form.Item>

          <Form.Item label="昵称" name="nickName">
            <Input placeholder="可选" maxLength={64} showCount />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="mobile"
            rules={[
              { required: true, message: '手机号不能为空' },
              { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input placeholder="请输入11位手机号" maxLength={11} />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '邮箱不能为空' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入邮箱" maxLength={120} />
          </Form.Item>

          <Form.Item label="性别" name="gender">
            <Radio.Group>
              <Radio value={Gender.Unknown}>未知</Radio>
              <Radio value={Gender.Male}>男</Radio>
              <Radio value={Gender.Female}>女</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="角色"
            name="roleIds"
            rules={[
              {
                validator: (_, value: number[]) =>
                  value && value.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('请为用户选择角色')),
              },
            ]}
          >
            <Select
              mode="multiple"
              options={roleOptions}
              placeholder="请选择角色"
              loading={roleSelectorQuery.isLoading}
              allowClear
            />
          </Form.Item>

          <Form.Item label="所属组织" name="departmentIds">
            <TreeSelect
              treeData={departmentTree}
              fieldNames={{ label: 'label', value: 'value', children: 'children' }}
              treeCheckable
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              placeholder="可多选"
              loading={regionSelectorQuery.isLoading}
              allowClear
              showSearch
              treeDefaultExpandAll
              maxTagCount="responsive"
            />
          </Form.Item>

          <Form.Item label="是否启用" name="isEnable" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} maxLength={512} showCount placeholder="可选" />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  )
}


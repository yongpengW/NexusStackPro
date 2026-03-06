import { useState, useEffect, useMemo } from 'react'
import {
  App,
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isBusinessError } from '@/utils/request'
import {
  MenuApi,
  MenuType,
  MenuTypeLabels,
  MenuIconType,
  MenuIconTypeLabels,
  PLATFORM_OPTIONS,
  type CreateMenuDto,
  type MenuTreeDto,
} from '@/services/menu'
import { MENU_QUERY_KEYS } from './useMenu'

interface MenuDrawerProps {
  open: boolean
  editId: number | null
  parentNode: MenuTreeDto | null
  treeData: MenuTreeDto[]
  platformType: number
  onClose: () => void
  onSuccess: () => void
}

function collectIdsByType(nodes: MenuTreeDto[], type: MenuType): { id: number; name: string }[] {
  const list: { id: number; name: string }[] = []
  const walk = (items: MenuTreeDto[]) => {
    for (const n of items) {
      if (n.type === type) list.push({ id: n.id, name: n.name })
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes)
  return list
}

function collectSelfAndDescendantIds(nodes: MenuTreeDto[], targetId: number): number[] {
  const ids: number[] = []
  const walk = (items: MenuTreeDto[]): boolean => {
    for (const n of items) {
      if (n.id === targetId) {
        ids.push(n.id)
        if (n.children?.length) {
          const collect = (list: MenuTreeDto[]) => {
            for (const c of list) {
              ids.push(c.id)
              if (c.children?.length) collect(c.children)
            }
          }
          collect(n.children)
        }
        return true
      }
      if (n.children?.length && walk(n.children)) return true
    }
    return false
  }
  walk(nodes)
  return ids
}

export function MenuDrawer({
  open,
  editId,
  parentNode,
  treeData,
  platformType,
  onClose,
  onSuccess,
}: MenuDrawerProps) {
  const isEdit = editId != null
  const [form] = Form.useForm<CreateMenuDto>()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: MENU_QUERY_KEYS.detail(editId ?? 0),
    queryFn: () => MenuApi.getById(editId!),
    enabled: isEdit && open,
  })

  const detail = detailQuery.data

  useEffect(() => {
    if (!open) {
      form.resetFields()
      setErrorMsg(null)
    }
  }, [open, form])

  useEffect(() => {
    if (isEdit && open && detail && detail.id === editId) {
      form.setFieldsValue({
        ...detail,
        parentId: detail.parentId || undefined,
      })
    } else if (!isEdit && open) {
      const nextType = parentNode
        ? Math.min((parentNode.type as number) + 1, MenuType.Operation) as MenuType
        : MenuType.Subsystem
      form.setFieldsValue({
        name: undefined,
        code: undefined,
        parentId: parentNode?.id ?? 0,
        type: nextType,
        platformType: parentNode ? parentNode.platformType : platformType || undefined,
        url: undefined,
        icon: undefined,
        iconType: MenuIconType.Icon,
        activeIcon: undefined,
        order: 0,
        isVisible: nextType !== MenuType.Operation,
        isExternalLink: false,
        remark: undefined,
      })
    }
  }, [isEdit, open, detail, editId, parentNode, platformType, form])

  const createMutation = useMutation({
    mutationFn: (data: CreateMenuDto) => MenuApi.create(data),
    onSuccess: () => {
      message.success('菜单添加成功')
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      onSuccess()
    },
    onError: (err: Error) => {
      if (isBusinessError(err)) setErrorMsg(err.message ?? '操作失败')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateMenuDto) => MenuApi.update(editId!, data),
    onSuccess: () => {
      message.success('保存成功')
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      onSuccess()
    },
    onError: (err: Error) => {
      if (isBusinessError(err)) setErrorMsg(err.message ?? '操作失败')
    },
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async () => {
    setErrorMsg(null)
    try {
      const values = await form.validateFields()
      const payload: CreateMenuDto = {
        ...values,
        parentId: values.parentId === 0 || values.parentId == null ? undefined : values.parentId,
        order: values.order ?? 0,
        isVisible: values.isVisible ?? true,
        isExternalLink: values.isExternalLink ?? false,
      }
      if (payload.type === MenuType.Operation) payload.isVisible = false
      if (isEdit) updateMutation.mutate(payload)
      else createMutation.mutate(payload)
    } catch {
      // validation errors inline
    }
  }

  const formType = Form.useWatch('type', form) as MenuType | undefined
  const currentType = formType ?? (isEdit && detail ? detail.type : (parentNode ? (parentNode.type as number) + 1 : MenuType.Subsystem)) as MenuType

  const parentOptions = useMemo(() => {
    if (currentType === MenuType.Subsystem) {
      return [{ label: '无（根节点）', value: 0 }]
    }
    const allowedParentType =
      currentType === MenuType.Directory ? MenuType.Subsystem
      : currentType === MenuType.Menu ? MenuType.Directory
      : MenuType.Menu
    const list = collectIdsByType(treeData, allowedParentType)
    const excludeIds = isEdit && editId ? collectSelfAndDescendantIds(treeData, editId) : []
    const filtered = list.filter((o) => !excludeIds.includes(o.id))
    return [{ label: '无（根节点）', value: 0 }, ...filtered.map((o) => ({ label: o.name, value: o.id }))]
  }, [currentType, treeData, isEdit, editId])

  const showUrl = currentType === MenuType.Menu
  const showIsVisible = currentType !== MenuType.Operation
  const showIsExternalLink = currentType === MenuType.Menu
  const showParent = currentType !== MenuType.Subsystem
  const showIcon = currentType !== MenuType.Operation

  const title = isEdit ? '编辑菜单' : parentNode ? `新增子项（${parentNode.name}）` : '新增根菜单'

  return (
    <Drawer
      title={title}
      width={520}
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
        {isEdit && (
          <Alert
            message="修改菜单类型可能导致层级混乱，请谨慎操作"
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

        <Form form={form} layout="vertical" initialValues={{ iconType: MenuIconType.Icon, order: 0, isVisible: true, isExternalLink: false }}>
          <Form.Item
            label="菜单名称"
            name="name"
            rules={[
              { required: true, message: '菜单名称不能为空' },
              { max: 256, message: '最多 256 个字符' },
            ]}
          >
            <Input placeholder="请输入菜单名称" maxLength={256} showCount />
          </Form.Item>

          <Form.Item
            label="菜单 Code"
            name="code"
            rules={[
              { required: true, message: '菜单代码不能为空' },
              { max: 256, message: '最多 256 个字符' },
            ]}
          >
            <Input placeholder="建议英文路径风格" maxLength={256} showCount />
          </Form.Item>

          <Form.Item
            label="所属平台"
            name="platformType"
            rules={[{ required: true, message: '请选择所属平台' }]}
          >
            <Select options={PLATFORM_OPTIONS} placeholder="请选择" />
          </Form.Item>

          <Form.Item
            label="菜单类型"
            name="type"
            rules={[{ required: true, message: '请选择菜单类型' }]}
          >
            <Radio.Group>
              {[MenuType.Subsystem, MenuType.Directory, MenuType.Menu, MenuType.Operation].map((t) => (
                <Radio key={t} value={t}>
                  {MenuTypeLabels[t]}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          {showParent && (
            <Form.Item label="上级菜单" name="parentId">
              <Select
                options={parentOptions}
                placeholder="请选择上级菜单"
                allowClear={false}
              />
            </Form.Item>
          )}

          {showUrl && (
            <Form.Item
              label="路由 URL"
              name="url"
              rules={[
                { required: true, message: '菜单类型为「菜单」时，路由地址不能为空' },
                { max: 1024 },
              ]}
            >
              <Input placeholder="如 /system/user" maxLength={1024} />
            </Form.Item>
          )}

          {showIcon && (
            <>
              <Form.Item label="图标" name="icon">
                <Input placeholder="图标名称或图片 URL" maxLength={1024} />
              </Form.Item>
              <Form.Item label="图标类型" name="iconType">
                <Radio.Group>
                  <Radio value={MenuIconType.Icon}>{MenuIconTypeLabels[MenuIconType.Icon]}</Radio>
                  <Radio value={MenuIconType.Picture}>{MenuIconTypeLabels[MenuIconType.Picture]}</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item label="选中图标" name="activeIcon">
                <Input placeholder="可选" maxLength={1024} />
              </Form.Item>
            </>
          )}

          <Form.Item
            label="排序"
            name="order"
            rules={[{ required: true, message: '请输入有效的排序值' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="数值越小越靠前" />
          </Form.Item>

          {showIsVisible && (
            <Form.Item label="是否可见" name="isVisible" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          )}

          {showIsExternalLink && (
            <Form.Item label="是否外链" name="isExternalLink" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          )}

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} maxLength={1024} showCount placeholder="可选" />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  )
}

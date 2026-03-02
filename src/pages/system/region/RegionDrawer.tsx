import { useState, useEffect } from 'react'
import {
  App,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Alert,
  Button,
  Space,
  Spin,
} from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RegionApi, RegionLevel, RegionLevelLabels } from '@/services/region'
import { REGION_QUERY_KEYS } from './useRegion'
import type { RegionTreeDto, CreateRegionDto } from '@/services/region'

// ─── Props ────────────────────────────────────────────────────────────────────

interface RegionDrawerProps {
  /** 抽屉是否可见 */
  open: boolean
  /** 编辑时传入目标 id；null 表示新增模式 */
  editId?: number | null
  /** 点击"新增子级"时传入父节点，预填 parentId 与 level */
  parentNode?: RegionTreeDto | null
  onClose: () => void
  onSuccess: () => void
}

// ─── 层级选项 ─────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = [
  { label: RegionLevelLabels[RegionLevel.Country],    value: RegionLevel.Country },
  { label: RegionLevelLabels[RegionLevel.Province],   value: RegionLevel.Province },
  { label: RegionLevelLabels[RegionLevel.City],       value: RegionLevel.City },
  { label: RegionLevelLabels[RegionLevel.Department], value: RegionLevel.Department },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function RegionDrawer({
  open,
  editId,
  parentNode,
  onClose,
  onSuccess,
}: RegionDrawerProps) {
  const isEdit = editId != null
  const [form] = Form.useForm<CreateRegionDto>()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ─── 上级区域选择器 ────────────────────────────────────────────────────
  const selectorQuery = useQuery({
    queryKey: REGION_QUERY_KEYS.selector,
    queryFn: () => RegionApi.getSelector(undefined, false),
    enabled: open,
    staleTime: 60 * 1000,
  })

  // ─── 编辑时获取详情回填 ───────────────────────────────────────────────
  const detailQuery = useQuery({
    queryKey: REGION_QUERY_KEYS.detail(editId ?? 0),
    queryFn: () => RegionApi.getById(editId!),
    enabled: isEdit && open,
  })

  // ─── 表单初始化 / 回填 ────────────────────────────────────────────────
  // 关闭时重置表单与错误提示
  useEffect(() => {
    if (!open) {
      form.resetFields()
      setErrorMsg(null)
    }
  }, [open, form])

  // 编辑详情加载完成后回填（数据异步到达时也能正确覆盖）
  useEffect(() => {
    if (isEdit && open && detailQuery.data) {
      form.setFieldsValue(detailQuery.data)
    }
  }, [isEdit, open, detailQuery.data, form])

  // Drawer 完全打开（动画结束）后再填写新增默认值，避免 DOM 未稳定时的闪烁
  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible || isEdit) return
    const defaultLevel =
      parentNode != null
        ? (Math.min(parentNode.level + 1, RegionLevel.Department) as RegionLevel)
        : RegionLevel.Country
    form.setFieldsValue({
      parentId: parentNode?.id ?? 0,
      level:    defaultLevel,
      order:    1,
      isEnable: true,
    })
  }

  // ─── Mutations ────────────────────────────────────────────────────────

  const onMutationSuccess = (successMsg: string) => {
    message.success(successMsg)
    queryClient.invalidateQueries({ queryKey: ['region'] })
    onSuccess()
  }
  const onMutationError = (err: Error) => setErrorMsg(err.message ?? '操作失败')

  const createMutation = useMutation({
    mutationFn: (data: CreateRegionDto) => RegionApi.create(data),
    onSuccess: () => onMutationSuccess('新增成功'),
    onError:   onMutationError,
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateRegionDto) => RegionApi.update(editId!, data),
    onSuccess: () => onMutationSuccess('保存成功'),
    onError:   onMutationError,
  })

  const submitting = createMutation.isPending || updateMutation.isPending

  // ─── 提交 ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setErrorMsg(null)
    try {
      const values = await form.validateFields()
      if (isEdit) {
        updateMutation.mutate(values)
      } else {
        createMutation.mutate(values)
      }
    } catch {
      // Ant Design form validation failed, errors shown inline
    }
  }

  // ─── 选择器选项（编辑时排除自身） ────────────────────────────────────

  const selectorOptions = [
    { label: '无（根节点）', value: 0 },
    ...(selectorQuery.data ?? [])
      .filter((o) => o.value !== editId)
      .map((o) => ({ label: o.label, value: o.value })),
  ]

  // ─── Title ────────────────────────────────────────────────────────────

  const drawerTitle = isEdit
    ? '编辑区域'
    : parentNode
    ? `新增子级区域（${parentNode.name}）`
    : '新增根节点'

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <Drawer
      title={drawerTitle}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnClose
      afterOpenChange={handleAfterOpenChange}
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
          initialValues={{ order: 1, isEnable: true, level: RegionLevel.Country, parentId: 0 }}
        >
          <Form.Item
            label="区域名称"
            name="name"
            rules={[
              { required: true, message: '区域名称不能为空' },
              { max: 64, message: '最多 64 个字符' },
            ]}
          >
            <Input placeholder="请输入区域名称" maxLength={64} showCount />
          </Form.Item>

          <Form.Item
            label="区域 Code"
            name="code"
            rules={[
              { required: true, message: '区域 Code 不能为空' },
              { max: 64, message: '最多 64 个字符' },
            ]}
          >
            <Input placeholder="建议大写英文或数字，如 HB" maxLength={64} showCount />
          </Form.Item>

          <Form.Item
            label="简称"
            name="shortName"
            rules={[{ max: 64, message: '最多 64 个字符' }]}
          >
            <Input placeholder="可选" maxLength={64} />
          </Form.Item>

          <Form.Item
            label="层级"
            name="level"
            rules={[{ required: true, message: '请选择层级' }]}
          >
            <Select options={LEVEL_OPTIONS} placeholder="请选择层级" />
          </Form.Item>

          <Form.Item label="上级区域" name="parentId">
            <Select
              options={selectorOptions}
              placeholder="请选择上级区域（不选则为根节点）"
              loading={selectorQuery.isLoading}
              showSearch
              optionFilterProp="label"
              allowClear={false}
            />
          </Form.Item>

          <Form.Item
            label="排序"
            name="order"
            rules={[{ required: true, message: '请输入有效的排序值' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="数值越小越靠前" />
          </Form.Item>

          <Form.Item label="是否启用" name="isEnable" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea
              rows={3}
              maxLength={512}
              showCount
              placeholder="可选"
            />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  )
}

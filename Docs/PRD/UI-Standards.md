# NexusStackPro 前端 UI 开发规范

> 适用范围：所有 RBAC 管理页面及后续新增功能页面  
> 技术栈：React 19 · Ant Design 5.x · @ant-design/pro-components 2.x · Zustand · @tanstack/react-query  
> 创建日期：2026-03-02

---

## 一、核心原则

1. **统一容器**：所有页面必须用 `PageContainer` 包裹，不允许裸露 `<div>` 作为顶层。
2. **ProComponents 优先**：列表用 `ProTable`，表单用 `ProForm` 系列，详情用 `ProDescriptions`。
3. **App 上下文**：在组件内统一从 `App.useApp()` 获取 `modal / message / notification`，**禁止使用**静态方法（`Modal.confirm()`、`message.success()` 等），React 19 中静态方法无法获取 ConfigProvider 主题。
4. **HTTP 工具**：使用项目封装的 `http`（`@/utils/request`），GET 参数用 `buildUrl` 工具函数拼接，POST/PUT body 直接传对象。
5. **组件复用**：相同功能的状态 Tag、操作列 Dropdown、Drawer 标题逻辑须抽取为公共组件或 Hook，避免在每个页面重复实现。

---

## 二、HTTP 工具使用规范

### 2.1 工具签名

```typescript
// @/utils/request
export const http = {
  get:    <T>(path: string, options?: RequestInit) => Promise<T>
  post:   <T>(path: string, body: unknown, options?: RequestInit) => Promise<T>
  put:    <T>(path: string, body: unknown, options?: RequestInit) => Promise<T>
  patch:  <T>(path: string, body: unknown, options?: RequestInit) => Promise<T>
  delete: <T>(path: string, options?: RequestInit) => Promise<T>
}
```

### 2.2 GET 请求传参：buildUrl 辅助函数

GET 参数**必须拼入 URL**，不支持 `options.params`。建议在 `@/utils/request.ts` 中添加并导出以下工具函数：

```typescript
/**
 * 将对象拼接为 URL 查询字符串，自动过滤 undefined / null / '' 值
 * 
 * @example
 *   buildUrl('/User/list', { userName: 'admin', isEnable: true, page: 1 })
 *   // → '/User/list?userName=admin&isEnable=true&page=1'
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return path
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `${path}?${qs}` : path
}
```

**使用示例：**

```typescript
import { http, buildUrl } from '@/utils/request'

// GET 带参数
const users = await http.get<IPagedList<UserDto>>(
  buildUrl('/User/list', { page: 1, limit: 10, userName: 'admin' })
)

// POST
const id = await http.post<number>('/User', createUserDto)

// PUT
await http.put<void>(`/User/${id}`, updateDto)

// DELETE
await http.delete<void>(`/User/${id}`)
```

### 2.3 分页接口返回格式

后端使用 `X.PagedList` 分页，序列化后结构如下：

```typescript
interface IPagedList<T> {
  pageNumber: number        // 当前页（1-based）
  pageSize: number          // 每页条数
  pageCount: number         // 总页数
  totalItemCount: number    // 总条数
  hasPreviousPage: boolean
  hasNextPage: boolean
  isFirstPage: boolean
  isLastPage: boolean
  // items 直接在 data 数组中（X.PagedList 序列化为带 metadata 的对象，items 作为顶层字段）
  // 或直接返回数组（取决于后端序列化配置，开发时以实际响应为准）
}
```

> **注意**：开发时请用浏览器 DevTools 确认分页响应的实际结构，ProTable `request` 函数中的 `total` 字段来源以实际字段名为准（通常是 `totalItemCount`）。

---

## 三、页面容器规范

所有管理页面必须使用 `PageContainer`：

```tsx
import { PageContainer } from '@ant-design/pro-components'

const MyPage: React.FC = () => (
  <PageContainer
    header={{
      title: '用户管理',
      // breadcrumb 由 ProLayout 自动生成，无需手动配置
    }}
  >
    {/* 页面内容 */}
  </PageContainer>
)
```

---

## 四、ProTable 使用规范

### 4.1 标准结构

```tsx
import type { ActionType, ProColumns } from '@ant-design/pro-components'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import { App, Button, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useRef } from 'react'
import { http, buildUrl } from '@/utils/request'

const MyListPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null)
  const { modal, message } = App.useApp()  // ← 必须从 App.useApp() 获取

  const columns: ProColumns<UserDto>[] = [
    {
      title: '账号',
      dataIndex: 'userName',
      // search: false  // 不在搜索表单中显示时加此属性
    },
    {
      title: '状态',
      dataIndex: 'isEnable',
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
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        <a key="edit" onClick={() => handleEdit(record)}>编辑</a>,
        // 超过 3 个操作时用 Dropdown（见 4.3 节）
      ],
    },
  ]

  return (
    <PageContainer>
      <ProTable<UserDto>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, userName, isEnable } = params
          const result = await http.get<IPagedList<UserDto>>(
            buildUrl('/User/list', {
              page: current,
              limit: pageSize,
              userName,
              isEnable,
            })
          )
          return {
            data: result.items ?? [],         // 数组字段名以实际响应为准
            total: result.totalItemCount,
            success: true,
          }
        }}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
    </PageContainer>
  )
}
```

### 4.2 必填属性

| 属性 | 要求 | 说明 |
|---|---|---|
| `rowKey` | 必须为 `"id"` | 唯一键 |
| `actionRef` | 必须定义 | 用于 `actionRef.current?.reload()` 刷新表格 |
| `search` | `{ labelWidth: 'auto' }` | 搜索栏标签宽度自动 |
| `pagination` | `{ pageSize: 10, showSizeChanger: true }` | 标准分页 |

### 4.3 操作列规范

- 操作 ≤ 2 个：直接展示为 `<a>` 链接；
- 操作 3–4 个：前 2 个直接显示，其余收入"更多"Dropdown；
- 危险操作（删除、禁用）用红色 `<a style={{ color: token.colorError }}>` 或 `danger` 属性；
- 删除/禁用**必须**使用 Popconfirm 或 `modal.confirm` 二次确认。

```tsx
import { Dropdown } from 'antd'
import { MoreOutlined } from '@ant-design/icons'

// 操作列示例（3+个操作时）
render: (_, record) => [
  <a key="edit" onClick={() => handleEdit(record)}>编辑</a>,
  <Dropdown
    key="more"
    menu={{
      items: [
        { key: 'enable',  label: '启用',  onClick: () => handleEnable(record)  },
        { key: 'disable', label: '禁用',  onClick: () => handleDisable(record), danger: true },
        { key: 'delete',  label: '删除',  onClick: () => handleDelete(record),  danger: true },
      ],
    }}
  >
    <a><MoreOutlined /> 更多</a>
  </Dropdown>,
]
```

---

## 五、树形表格规范（Region / Menu 页面）

树形数据（Region、Menu）使用标准 Ant Design `Table` 的 `expandable` 模式，**不使用** ProTable 的树形模式（层级控制差异大）：

```tsx
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

<Table<RegionTreeDto>
  dataSource={treeData}
  columns={columns}
  rowKey="id"
  expandable={{
    defaultExpandedRowKeys: rootIds,
  }}
  pagination={false}   // 树形数据通常不分页
  loading={loading}
/>
```

**搜索时切换模式**：关键词非空时调用 list 接口返回扁平数组，渲染为普通表格；关键词清空后恢复树形。

---

## 六、Drawer + ProForm 表单规范

### 6.1 标准结构

```tsx
import { ProForm, ProFormText, ProFormSelect, ProFormSwitch, DrawerForm } from '@ant-design/pro-components'

// 推荐：使用 DrawerForm（ProComponents 提供的 Drawer+Form 一体组件）
<DrawerForm<CreateUserDto>
  title={editId ? '编辑用户' : '新增用户'}
  open={drawerOpen}
  onOpenChange={setDrawerOpen}
  width={520}
  onFinish={async (values) => {
    try {
      if (editId) {
        await http.put<void>(`/User/${editId}`, values)
        message.success('保存成功')
      } else {
        await http.post<number>('/User', values)
        message.success('用户创建成功，初始密码为手机号后6位')
      }
      actionRef.current?.reload()
      return true  // 返回 true 自动关闭 Drawer
    } catch {
      return false  // 返回 false 保持 Drawer 打开
    }
  }}
  // 编辑时回填数据
  initialValues={currentRecord}
>
  <ProFormText name="userName" label="账号" rules={[{ required: true }]} />
  <ProFormText name="mobile"   label="手机号" rules={[{ required: true }]} />
  <ProFormSelect
    name="userRoles"
    label="角色"
    mode="multiple"
    request={() => RoleApi.getSelector()}  // 异步加载选项
    fieldProps={{ fieldNames: { label: 'label', value: 'value' } }}
    rules={[{ required: true, message: '请选择角色' }]}
  />
  <ProFormSwitch name="isEnable" label="是否启用" initialValue={true} />
</DrawerForm>
```

> **DrawerForm vs Drawer+Form**：优先使用 `DrawerForm`（`@ant-design/pro-components` 导出），它自带 loading 状态、提交逻辑和关闭联动，减少样板代码。特别复杂的场景（多步骤、嵌套复杂交互）才回退到手动 `Drawer` + `Form`。

### 6.2 ProForm 常用字段组件映射

| 场景 | 组件 |
|---|---|
| 文本输入 | `ProFormText` |
| 数字输入 | `ProFormDigit` |
| 下拉单选 | `ProFormSelect` |
| 下拉多选 | `ProFormSelect mode="multiple"` |
| 开关 | `ProFormSwitch` |
| 文本域 | `ProFormTextArea` |
| 树形选择 | `ProFormTreeSelect` |
| 单选组 | `ProFormRadio.Group` |
| 复选组 | `ProFormCheckbox.Group` |

---

## 七、确认弹窗规范

```tsx
// ✅ 正确：从 App.useApp() 获取
const { modal, message } = App.useApp()

modal.confirm({
  title: '确认禁用该用户？',
  content: '禁用后该用户将无法登录系统',
  okText: '确认',
  cancelText: '取消',
  okType: 'danger',
  onOk: async () => {
    await http.put<void>(`/User/disable/${id}`, {})
    message.success('已禁用')
    actionRef.current?.reload()
  },
})

// ❌ 错误：静态方法在 React 19 中无法获取主题上下文
Modal.confirm({ ... })
```

---

## 八、状态 Tag 颜色规范

### 8.1 启用/禁用状态

```tsx
<Tag color={isEnable ? 'success' : 'default'}>
  {isEnable ? '启用' : '禁用'}
</Tag>
```

### 8.2 平台类型 Tag（PlatformType Flags 枚举拆解）

```typescript
// @/utils/platform.ts  建议封装为公共工具
export const PLATFORM_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '超管',  color: 'red'    },  // Admin
  2: { label: 'PC端', color: 'blue'   },  // Pc
  4: { label: '小程序', color: 'green'  },  // Mini
  8: { label: 'App',  color: 'orange' },  // Android
}

/** 将 Flags 位掩码拆解为平台 Tag 数组 */
export function PlatformTags({ platforms }: { platforms: number }) {
  return (
    <>
      {Object.entries(PLATFORM_MAP).map(([bit, { label, color }]) =>
        platforms & Number(bit) ? (
          <Tag key={bit} color={color}>{label}</Tag>
        ) : null
      )}
    </>
  )
}
```

**使用：**

```tsx
// 在 ProTable 列或任意位置使用
<PlatformTags platforms={record.platforms} />
```

### 8.3 菜单类型 Tag

```typescript
export const MENU_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '子系统', color: 'purple'  },
  2: { label: '目录',   color: 'blue'   },
  3: { label: '菜单',   color: 'cyan'   },
  4: { label: '操作',   color: 'orange' },
}
```

---

## 九、loading 状态规范

| 场景 | 实现方式 |
|---|---|
| ProTable 数据加载 | ProTable 内置，`request` 执行期间自动 spin |
| DrawerForm 提交 | `onFinish` 为 async 时 DrawerForm 自动处理提交按钮 loading |
| 手动 Drawer + Form | `<Button loading={submitting}>确认提交</Button>` |
| 行内单条操作（启禁用） | 维护 `loadingId: number \| null` 状态，`<Button loading={loadingId === record.id}>` |
| 整页初始化 | 用 `ProTable` 的 `loading` prop 或 `Table` 的 `loading` prop |

---

## 十、权限管理页面（左右分栏）规范

权限管理页采用左右分栏布局，不使用 ProTable：

```tsx
import { Card, Row, Col } from 'antd'

<PageContainer>
  <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
    {/* 左栏 - 角色列表 */}
    <Col flex="240px">
      <Card
        title="角色列表"
        bodyStyle={{ padding: 0, overflowY: 'auto', height: '100%' }}
      >
        {/* 角色 Menu 列表 */}
      </Card>
    </Col>

    {/* 右栏 - 权限树 */}
    <Col flex="1">
      <Card
        title={`配置角色：${selectedRole?.name ?? '请选择角色'}`}
        extra={<Button type="primary" onClick={handleSave}>保存权限</Button>}
      >
        {/* Ant Design Tree 组件 */}
      </Card>
    </Col>
  </Row>
</PageContainer>
```

权限树使用 Ant Design `Tree` 组件（`@ant-design/pro-components` 没有封装权限树）：

```tsx
import { Tree } from 'antd'

<Tree
  checkable
  checkedKeys={checkedKeys}
  onCheck={(checked, info) => {
    // checked 为 { checked: Key[], halfChecked: Key[] }
    const { checked: ck, halfChecked: hk } = checked as { checked: React.Key[]; halfChecked: React.Key[] }
    setCheckedKeys(ck as number[])
    setHalfCheckedKeys(hk as number[])
  }}
  treeData={treeData}
  fieldNames={{ key: 'menuId', title: 'menuName', children: 'children' }}
/>
```

---

## 十一、React Query 使用规范

### 11.1 全局配置（已在 main.tsx 设定，开发时无需修改）

```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // 窗口重获焦点不自动重请求（管理后台场景）
      retry: 1,                      // 失败重试 1 次（默认 3 次，减少无效等待）
      staleTime: 5 * 60 * 1000,     // 数据 5 分钟内视为"新鲜"，不重复请求
    },
    mutations: {
      retry: 0,                      // 写操作失败不重试（避免重复提交）
    },
  },
})
```

**staleTime 含义**：同一 `queryKey` 在 5 分钟内被多次请求时，直接从内存返回缓存数据，不发起网络请求。适合角色列表、区域选择器等不频繁变更的基础数据。

---

### 11.2 何时用 React Query，何时用 ProTable.request

| 场景 | 推荐方式 | 原因 |
|---|---|---|
| 分页列表（User、Role 等） | **ProTable `request` prop** | ProTable 自带分页状态、搜索联动、loading、`actionRef.reload()` |
| 树形数据（Region、Menu） | **`useQuery`** | 树形不需要分页，`useQuery` 的缓存+自动重请求更合适 |
| Drawer 内详情回填（`getById`） | **`useQuery`**（懒加载） | 按需触发，带缓存，避免重复请求同一 id |
| 选择器数据（role selector 等） | **`useQuery`** | 多处复用，staleTime 避免重复请求 |
| 权限树数据 | **`useQuery`** | 随角色/平台切换而变化，queryKey 含参数即可 |
| 新增 / 编辑 / 删除 / 启禁用 | **`useMutation`** | 写操作天然 mutation 语义 |

---

### 11.3 QueryKey 命名约定

QueryKey 必须是数组，第一个元素为资源名（小写复数），后续元素为查询参数：

```typescript
// 无参查询
['regions']             // 区域树
['roles']               // 角色列表（无参时）
['role-selector']       // 角色选择器（全量，无参）

// 带参查询
['role-permission', roleId, platformType]   // 特定角色的权限树
['region', id]                               // 单条详情
['menu-resources', menuId]                   // 菜单已绑定的 API 资源
['users', { page, pageSize, ...filters }]    // 分页列表（一般交给 ProTable 管理）
```

---

### 11.4 useQuery 使用模式

#### 树形/列表数据

```tsx
import { useQuery } from '@tanstack/react-query'
import { RegionApi } from '@/services/region'

// 区域树（无参，staleTime 5min 自动缓存）
const { data: treeData = [], isLoading } = useQuery({
  queryKey: ['regions'],
  queryFn: () => RegionApi.getTree(),
})
```

#### 选择器数据（跨多个组件复用时尤为有价值）

```tsx
// 角色选择器——在 User Drawer 和 Role 页面都会用到
// 因 staleTime=5min，两处只会发起 1 次请求
const { data: roleOptions = [] } = useQuery({
  queryKey: ['role-selector'],
  queryFn: () => RoleApi.getSelector(),
})
```

#### Drawer 详情回填（按需懒加载）

```tsx
// editId 为 null 时（新增模式）不发请求
const { data: detail, isLoading: detailLoading } = useQuery({
  queryKey: ['region', editId],
  queryFn: () => RegionApi.getById(editId!),
  enabled: editId !== null,   // ← 关键：editId 有值时才发请求
})
```

#### 带参数的权限树（随选中角色切换）

```tsx
const { data: permissionTree = [], isLoading: treeLoading } = useQuery({
  queryKey: ['role-permission', selectedRoleId, platformType],
  queryFn: () => PermissionApi.getRolePermission(selectedRoleId!, platformType),
  enabled: selectedRoleId !== null,
})
```

---

### 11.5 useMutation 使用模式

#### 标准 mutation 结构（以新增区域为例）

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { RegionApi } from '@/services/region'

const queryClient = useQueryClient()
const { message } = App.useApp()

const createMutation = useMutation({
  mutationFn: (data: CreateRegionDto) => RegionApi.create(data),
  onSuccess: () => {
    // 1. 使相关缓存失效，触发重新请求
    queryClient.invalidateQueries({ queryKey: ['regions'] })
    // 2. 用户反馈
    message.success('创建成功')
    // 3. 关闭 Drawer（由调用方决定）
  },
  onError: (err) => {
    // request.ts 已全局处理 403/500/网络错误（globalNotification）
    // 此处仅需处理业务层错误（4xx 中非 401/403 的部分）
    if (err instanceof ApiError && err.code !== 403 && err.code !== 500) {
      message.error(err.message)
    }
    // 其他错误（403/500/网络）已被 request.ts 全局处理，静默丢弃即可
  },
})

// 调用
createMutation.mutate(formValues)

// 在 DrawerForm.onFinish 中使用（需 async + try/catch）
const handleFinish = async (values: CreateRegionDto) => {
  try {
    await createMutation.mutateAsync(values)
    return true   // 告诉 DrawerForm 关闭
  } catch {
    return false  // 告诉 DrawerForm 保持打开
  }
}
```

#### 状态切换（启用/禁用）——行内操作

```tsx
// 维护正在操作的行 id，实现行级 loading
const [operatingId, setOperatingId] = useState<number | null>(null)

const toggleMutation = useMutation({
  mutationFn: ({ id, enable }: { id: number; enable: boolean }) =>
    enable ? RegionApi.enable(id) : RegionApi.disable(id),
  onSuccess: (_, { enable }) => {
    queryClient.invalidateQueries({ queryKey: ['regions'] })
    message.success(enable ? '已启用' : '已禁用')
  },
  onSettled: () => setOperatingId(null),  // 无论成功失败都清除 loading 状态
})

// 操作列中使用
<Button
  size="small"
  loading={operatingId === record.id}
  onClick={() => {
    setOperatingId(record.id)
    toggleMutation.mutate({ id: record.id, enable: !record.isEnable })
  }}
>
  {record.isEnable ? '禁用' : '启用'}
</Button>
```

#### 删除——配合 modal.confirm

```tsx
const deleteMutation = useMutation({
  mutationFn: (id: number) => RegionApi.remove(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['regions'] })
    message.success('删除成功')
  },
})

const handleDelete = (record: RegionDto) => {
  modal.confirm({
    title: `确认删除「${record.name}」？`,
    content: '删除后不可恢复',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => deleteMutation.mutateAsync(record.id),
  })
}
```

---

### 11.6 与 request.ts 全局错误处理的协作关系

项目的 `request.ts` 已内置全局错误拦截：

| 错误类型 | request.ts 处理 | React Query onError 是否需要处理 |
|---|---|---|
| 网络不通（code=0） | `globalNotification.error('网络连接失败')` | **不需要**，静默即可 |
| 401 未登录 | 自动刷新 token / 登出跳转 | **不需要** |
| 403 无权限 | `globalNotification.error('无访问权限')` | **不需要** |
| 500 服务器错误 | `globalNotification.error('服务器错误')` | **不需要** |
| 其他业务错误（4xx） | **不处理**，抛出 `ApiError` | **需要处理**，用 `message.error(err.message)` |

因此 **`onError` 的标准写法**：

```typescript
onError: (err) => {
  // 仅处理业务层错误，全局错误（403/500/网络）已由 request.ts 处理
  if (err instanceof ApiError && ![0, 401, 403, 500].includes(err.code)) {
    message.error(err.message)
  }
}
```

---

### 11.7 缓存失效策略

```typescript
const queryClient = useQueryClient()

// 失效单个资源的所有查询（最常用）
queryClient.invalidateQueries({ queryKey: ['regions'] })

// 失效精确匹配的查询
queryClient.invalidateQueries({ queryKey: ['region', id], exact: true })

// 失效多个相关资源（如保存权限后，权限树和角色列表都要更新）
await Promise.all([
  queryClient.invalidateQueries({ queryKey: ['role-permission'] }),
  queryClient.invalidateQueries({ queryKey: ['roles'] }),
])

// 直接更新缓存（乐观更新，无需重请求——适合简单状态切换）
queryClient.setQueryData(['region', id], (old: RegionDto) => ({
  ...old,
  isEnable: !old.isEnable,
}))
```

---

### 11.8 ProTable + React Query 组合模式

当 ProTable 的外部依赖数据（如选择器选项）需要缓存时，混合使用：

```tsx
const MyPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null)

  // 角色选择器：React Query 缓存，不重复请求
  const { data: roleOptions = [] } = useQuery({
    queryKey: ['role-selector'],
    queryFn: () => RoleApi.getSelector(),
  })

  // 用户列表：ProTable 管理分页+搜索
  return (
    <ProTable
      actionRef={actionRef}
      request={async (params) => {
        const result = await http.get<IPagedList<UserDto>>(
          buildUrl('/User/list', { page: params.current, limit: params.pageSize, ...params })
        )
        return { data: result.items, total: result.totalItemCount, success: true }
      }}
      columns={[
        {
          title: '角色',
          dataIndex: 'roleId',
          valueType: 'select',
          fieldProps: { options: roleOptions },  // 注入缓存的选择器数据
        },
        // ...
      ]}
    />
  )
}
```

---

## 十二、服务层（services）代码规范

### 12.1 文件位置与命名

```
src/services/
├── auth.ts         # 已有
├── region.ts       # 区域
├── user.ts         # 用户
├── role.ts         # 角色
├── menu.ts         # 菜单
└── permission.ts   # 权限
```

### 12.2 服务函数模板

```typescript
// src/services/region.ts
import { http, buildUrl } from '@/utils/request'
import type { RegionTreeDto, RegionDto, CreateRegionDto } from '@/types/region'

export const RegionApi = {
  /** 获取树形数据 */
  getTree: (params?: { parentId?: number; includeChilds?: boolean }) =>
    http.get<RegionTreeDto[]>(buildUrl('/Region/tree', params)),

  /** 关键词搜索（扁平列表） */
  getList: (params?: { keyword?: string }) =>
    http.get<RegionDto[]>(buildUrl('/Region/list', params)),

  /** 选择器数据 */
  getSelector: (level?: number, isIncludeZero = true) =>
    http.get<SelectOptionDto[]>(buildUrl('/Region/selector', { level, isIncludeZero })),

  /** 详情 */
  getById: (id: number) =>
    http.get<RegionDto>(`/Region/${id}`),

  /** 新增 */
  create: (data: CreateRegionDto) =>
    http.post<number>('/Region', data),

  /** 编辑 */
  update: (id: number, data: CreateRegionDto) =>
    http.put<void>(`/Region/${id}`, data),

  /** 删除 */
  remove: (id: number) =>
    http.delete<void>(`/Region/${id}`),

  /** 启用 */
  enable: (id: number) =>
    http.put<void>(`/Region/Enable/${id}`, {}),

  /** 禁用 */
  disable: (id: number) =>
    http.put<void>(`/Region/Disable/${id}`, {}),
}
```

> **关键规则**：
> - GET 带参数用 `buildUrl(path, params)` 拼接；
> - PUT/DELETE 无 body 时传 `{}` 或不传（视后端要求）；
> - 函数命名：`getXxx` / `create` / `update` / `remove` / `enable` / `disable`，保持统一。

---

## 十三、类型定义规范

```
src/types/
├── common.ts       # 公共类型（SelectOptionDto, IPagedList 等）
├── region.ts
├── user.ts
├── role.ts
├── menu.ts
└── permission.ts
```

**公共类型模板（`src/types/common.ts`）：**

```typescript
/** 选择器选项 */
export interface SelectOptionDto {
  label: string
  value: number
}

/** 分页列表（X.PagedList 后端序列化格式，以实际响应为准） */
export interface IPagedList<T> {
  pageNumber: number
  pageSize: number
  pageCount: number
  totalItemCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  // 数据列表字段名以实际后端响应为准（可能是 items 或直接为数组）
}

/** PlatformType Flags 枚举 */
export enum PlatformType {
  All     = 0,
  Admin   = 1,
  Pc      = 2,
  Mini    = 4,
  Android = 8,
}

/** RegionLevel 枚举 */
export enum RegionLevel {
  Country  = 0,
  Province = 1,
  City     = 2,
}

/** MenuType 枚举 */
export enum MenuType {
  Subsystem = 1,
  Directory = 2,
  Menu      = 3,
  Operation = 4,
}

/** MenuIconType 枚举 */
export enum MenuIconType {
  Icon    = 1,
  Picture = 2,
}

/** Gender 枚举 */
export enum Gender {
  Unknown = 0,
  Male    = 1,
  Female  = 2,
}
```

---

## 十四、各页面组件选型速查

| 页面 | 主体组件 | 辅助组件 |
|---|---|---|
| 区域管理 | `Table`（expandable 树形） | `DrawerForm` (新增/编辑)、`Tree` (上级选择) |
| 用户管理 | `ProTable`（分页） | `DrawerForm`、`Tag`（角色/状态）、`Avatar` |
| 角色管理 | `ProTable`（分页） | `DrawerForm`、`DrawerForm`（权限配置）、`Tree` |
| 菜单管理 | `Table`（expandable 树形） | `DrawerForm`、`Drawer`（API 绑定，含 Collapse+Checkbox） |
| 权限管理 | `Row+Col` 分栏、`Tree`（权限树） | `Card`（左右栏容器）、`Menu`（角色列表） |

---

*本文档随项目迭代持续更新，新增页面开发前必须阅读。*

*最后更新：2026-03-02*

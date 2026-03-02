# PRD：区域／部门管理页面（Region Management）

> 文档版本：V1.0  
> 创建日期：2026-03-02  
> 所属模块：系统管理 → 区域管理  
> 对应后端控制器：`RegionController`  
> UI 规范：参见 [UI-Standards.md](./UI-Standards.md)  
> 文档状态：**待开发**

---

## 一、页面概述

### 1.1 业务背景

在 NexusStack RBAC 体系中，`Region` 表统一承载**区域 / 部门 / 公司 / 分支机构**等所有组织单元，是用户归属和数据范围（`DataRange`）控制的基础数据。每个用户可以通过 `UserDepartment` 关联表绑定到一个或多个 Region 节点，从而决定该用户可见的数据范围。

### 1.2 页面目标

- 提供完整的区域（组织单元）**树状管理**能力，支持多层级增删改查；
- 支持按名称、简称、Code 模糊搜索快速定位节点；
- 支持启用 / 禁用控制，禁用后该区域下的用户不再获得对应数据访问权；
- 为用户管理、角色管理等其他页面提供**选择器数据来源**。

### 1.3 适用用户

| 角色 | 操作权限 |
|---|---|
| 超级管理员 | 全部操作（增删改、启禁用） |
| 系统管理员 | 查看、新增、编辑、启禁用（禁止删除） |
| 普通用户 | 仅只读查看（通过区域选择器） |

---

## 二、页面布局

### 2.1 整体结构

```
┌──────────────────────────────────────────────────────────────────┐
│  页面标题：区域管理                            [+ 新增根节点]     │
├──────────────────────────────────────────────────────────────────┤
│  搜索栏：[关键词搜索____________] [搜索] [重置]                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  区域树形表格（TreeTable）                                        │
│                                                                    │
│  名称          简称    Code    层级    排序  状态    操作          │
│  ▼ 总公司      总部    ROOT    公司    1     启用    编辑 新增子级 更多▼  │
│    ▼ 华北区    华北    HB      省/区   1     启用    编辑 新增子级 更多▼  │
│      ├ 北京    BJ      BJ      城市    1     启用    编辑 新增子级 更多▼  │
│      └ 天津    TJ      TJ      城市    2     启用    编辑 新增子级 更多▼  │
│    ▶ 华南区    ...                                                 │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 布局说明

- 采用 **Ant Design `Table` 的 `expandable` 属性**实现树形表格，支持行级展开/收起；
- 默认展开第一层（根节点）；
- 操作列"更多"折叠低频操作（启用 / 禁用 / 删除）减少视觉噪音；
- 搜索命中时高亮关键词，并**自动展开**所有包含结果的父节点路径。

---

## 三、功能需求

### 3.1 树形列表展示

**数据来源**：`GET /api/Region/tree`

**展示字段**：

| 列名 | 字段 | 说明 |
|---|---|---|
| 名称 | `name` | 支持搜索高亮 |
| 简称 | `shortName` | 可为空 |
| Code | `code` | 区域唯一编码，支持搜索高亮 |
| 层级 | `level` | 枚举显示：`0→公司` `1→省/区` `2→城市` |
| 排序 | `order` | 数字 |
| 状态 | `isEnable` | 绿色"启用" / 灰色"禁用" 徽标 |
| 操作 | - | 见第 3.3 节 |

**交互说明**：
- 树节点默认按 `order` 升序排列；
- 父节点折叠时，其子节点操作均不可见；
- 禁用的节点行整体显示灰色（opacity: 0.5），以示区分；
- 列表支持"展开全部 / 收起全部"快捷按钮。

### 3.2 搜索过滤

**数据来源**：`GET /api/Region/list?Keyword=xxx`（关键词模糊匹配 Name / ShortName / Code）

**交互说明**：
- 关键词非空时调用 list 接口返回**扁平列表**并在表格中以高亮方式展示；
- 关键词清空后恢复调用 tree 接口，还原树形视图；
- 搜索与重置按钮同行放置于表格顶部；
- 搜索请求防抖 300ms，避免高频输入触发请求。

### 3.3 操作按钮

每行操作列包含以下操作（超过 3 个收入"更多"下拉）：

| 操作 | 显示条件 | 说明 |
|---|---|---|
| **编辑** | 始终显示 | 打开编辑 Drawer |
| **新增子级** | 始终显示 | 打开新增 Drawer，ParentId 预填为当前行 Id |
| **启用** | `isEnable = false` | 调用启用接口 |
| **禁用** | `isEnable = true` | 调用禁用接口，弹出二次确认 |
| **删除** | `children` 为空 | 调用删除接口，弹出二次确认；有子节点时置灰并 Tooltip 提示"请先删除子级区域" |

顶部"新增根节点"按钮：打开新增 Drawer，`ParentId` 默认为 `0`，`Level` 默认为 `Country(0)`。

### 3.4 新增区域

**接口**：`POST /api/Region`  
**触发入口**：顶部"新增根节点"按钮 / 行操作"新增子级"  
**交互形式**：右侧 Drawer（宽度 480px）

**表单字段**：

| 字段 | 组件 | 必填 | 校验规则 |
|---|---|---|---|
| 区域名称 | Input | ✅ | 不能为空，最大 64 字符 |
| 区域 Code | Input | ✅ | 不能为空，最大 64 字符，建议大写英文或数字 |
| 简称 | Input | ❌ | 最大 64 字符 |
| 层级 | Select | ✅ | 选项：公司(0) / 省/区(1) / 城市(2)；新增子级时自动推断（父级层级+1）但允许手动修改 |
| 上级区域 | Select（树形选择） | ❌ | 数据来自 `GET /api/Region/selector`；根节点时留空或选"无"（值为 0） |
| 排序 | InputNumber | ✅ | 默认值 1，最小 0，整数 |
| 是否启用 | Switch | ✅ | 默认开启 |
| 备注 | TextArea | ❌ | 最大 512 字符 |

**提交逻辑**：
1. 表单校验通过后调用 `POST /api/Region`；
2. 成功后关闭 Drawer，刷新树形列表；
3. 失败时在 Drawer 内显示错误提示，不关闭。

### 3.5 编辑区域

**接口**：`GET /api/Region/{id}`（回显数据）、`PUT /api/Region/{id}`（保存）  
**触发入口**：行操作"编辑"  
**交互形式**：右侧 Drawer（宽度 480px），与新增共用同一 Drawer 组件

**交互说明**：
- 打开 Drawer 时先请求 `GET /api/Region/{id}` 获取最新数据回填（不使用行数据，防止展示态与实际不一致）；
- "上级区域"选择框中不允许选择自身（后端兜底：若 `ParentId == entity.Id`，服务端自动置 0）；
- 表单字段与新增一致；
- 保存成功后刷新当前行及父节点数据。

### 3.6 删除区域

**接口**：`DELETE /api/Region/{id}`  
**前置条件**：后端已校验"有子节点时拒绝删除"

**交互说明**：
- 点击删除后弹出 `Popconfirm`："确认删除该区域？删除后不可恢复。"；
- 有子节点时删除按钮 disabled，Tooltip 提示"请先删除子级区域"；
- 删除成功后从树中移除该节点，无需整页刷新。

### 3.7 启用 / 禁用

**接口**：`PUT /api/Region/Enable/{id}` / `PUT /api/Region/Disable/{id}`

**交互说明**：
- 禁用时弹出 `Popconfirm`："禁用后，该区域下的用户数据范围将受到限制，确认禁用？"；
- 启用时直接调用，不弹确认；
- 操作完成后更新当前行状态，不刷新整页。

---

## 四、接口清单

| # | 方法 | 路径 | 功能 | 使用时机 |
|---|---|---|---|---|
| 1 | GET | `/api/Region/tree` | 获取完整树形数据 | 页面初始化、操作完成后刷新 |
| 2 | GET | `/api/Region/list` | 关键词模糊搜索（扁平列表） | 搜索框有值时 |
| 3 | GET | `/api/Region/{id}` | 获取单条区域详情 | 打开编辑 Drawer 时 |
| 4 | GET | `/api/Region/selector` | 上级区域选择器数据 | 新增/编辑 Drawer 内"上级区域"字段 |
| 5 | POST | `/api/Region` | 新增区域 | 新增 Drawer 提交 |
| 6 | PUT | `/api/Region/{id}` | 编辑区域 | 编辑 Drawer 提交 |
| 7 | DELETE | `/api/Region/{id}` | 删除区域 | 删除确认后 |
| 8 | PUT | `/api/Region/Enable/{id}` | 启用区域 | 点击"启用"操作 |
| 9 | PUT | `/api/Region/Disable/{id}` | 禁用区域 | 点击"禁用"操作确认后 |

---

## 五、数据模型

### 5.1 展示数据（RegionTreeDto / RegionDto）

```typescript
interface RegionDto {
  id: number;
  name: string;           // 名称（必填，最大 64 字符）
  shortName: string;      // 简称
  code: string;           // Code（必填，最大 64 字符）
  parentId: number;       // 父级 Id，0 表示根节点
  level: RegionLevel;     // 0=公司 1=省/区 2=城市
  order: number;          // 排序
  idSequences: string;    // 祖先 Id 路径，如 "0.1.5"
  isEnable: boolean;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

interface RegionTreeDto extends RegionDto {
  children: RegionTreeDto[];
}

enum RegionLevel {
  Country  = 0,   // 公司 / 国家级
  Province = 1,   // 省 / 区域级
  City     = 2,   // 城市 / 部门级
}
```

### 5.2 创建 / 编辑请求体（CreateRegionDto）

```typescript
interface CreateRegionDto {
  name: string;           // 必填
  code: string;           // 必填
  shortName?: string;
  level: RegionLevel;     // 必填
  parentId: number;       // 0 = 根节点
  order: number;          // 默认 1
  isEnable: boolean;      // 默认 true
  remark?: string;
}
```

---

## 六、Drawer 表单设计

### 6.1 布局示意

```
┌──────────────────────── 新增区域 ──────────────── [×] ┐
│                                                        │
│  区域名称 *  [____________________]                    │
│  区域 Code * [____________________]                    │
│  简称        [____________________]                    │
│  层级    *   [公司(0)    ▼]                            │
│  上级区域    [请选择 ▼（来自 selector 接口）]           │
│  排序    *   [1  ▲▼]                                   │
│  是否启用    [●────] 启用                              │
│  备注        [                    ]                    │
│              [                    ]                    │
│                                                        │
│                          [取消]  [确认提交]            │
└────────────────────────────────────────────────────────┘
```

### 6.2 层级自动推断规则

| 触发时机 | 推断逻辑 |
|---|---|
| 点击"新增根节点" | `Level` 默认 `Country(0)` |
| 点击行"新增子级" | `Level = min(父节点Level + 1, City=2)` |
| 手动更改"上级区域" | `Level` 自动随父级层级更新，但用户可手动覆盖 |

---

## 七、交互规范

### 7.1 loading 状态

| 操作 | loading 范围 |
|---|---|
| 页面初始化 | 整个表格区域显示骨架屏（Skeleton） |
| 搜索 | 表格区域 spin |
| 提交新增 / 编辑 | Drawer 内"确认提交"按钮 loading |
| 删除 / 启禁用 | 对应行操作按钮 loading，其余行可正常操作 |

### 7.2 消息反馈

| 操作 | 成功提示 | 失败提示 |
|---|---|---|
| 新增 | `message.success('新增成功')` | 在 Drawer 内显示错误 Alert |
| 编辑 | `message.success('保存成功')` | 在 Drawer 内显示错误 Alert |
| 删除 | `message.success('删除成功')` | `message.error(服务端错误信息)` |
| 启用 | `message.success('已启用')` | `message.error(服务端错误信息)` |
| 禁用 | `message.success('已禁用')` | `message.error(服务端错误信息)` |

### 7.3 空状态

- 树形列表无数据时，显示 Ant Design 空状态组件并附加"暂无区域数据，点击右上角新增"引导文案；
- 搜索无结果时，显示"未找到匹配的区域，请更换关键词"。

---

## 八、字段校验规范

| 字段 | 规则 | 错误提示文案 |
|---|---|---|
| 区域名称 | 必填，长度 1–64 | "区域名称不能为空" / "最多 64 个字符" |
| 区域 Code | 必填，长度 1–64 | "区域 Code 不能为空" / "最多 64 个字符" |
| 简称 | 可空，长度 0–64 | "最多 64 个字符" |
| 层级 | 必填，枚举值 0/1/2 | "请选择层级" |
| 排序 | 必填，非负整数 | "请输入有效的排序值" |

---

## 九、前端文件规划

```
src/pages/system/region/
├── index.tsx           # 页面主文件（树形表格 + 搜索栏）
├── RegionDrawer.tsx    # 新增/编辑 Drawer（共用，title 动态切换）
└── useRegion.ts        # 数据逻辑 Hook（API 调用、状态管理、刷新逻辑）

src/services/region.ts  # Region 相关 API 封装
```

### 9.1 services/region.ts 接口封装

> GET 参数必须用 `buildUrl` 拼入 URL，详见 [UI-Standards.md §2](./UI-Standards.md)

```typescript
// src/services/region.ts
import { http, buildUrl } from '@/utils/request'

export const RegionApi = {
  getTree:     (params?: { parentId?: number; includeChilds?: boolean }) =>
    http.get<RegionTreeDto[]>(buildUrl('/Region/tree', params)),

  getList:     (params?: { keyword?: string }) =>
    http.get<RegionDto[]>(buildUrl('/Region/list', params)),

  getSelector: (level?: number, isIncludeZero = true) =>
    http.get<SelectOptionDto[]>(buildUrl('/Region/selector', { level, isIncludeZero })),

  getById:     (id: number) =>
    http.get<RegionDto>(`/Region/${id}`),

  create:      (data: CreateRegionDto) =>
    http.post<number>('/Region', data),

  update:      (id: number, data: CreateRegionDto) =>
    http.put<void>(`/Region/${id}`, data),

  remove:      (id: number) =>
    http.delete<void>(`/Region/${id}`),

  enable:      (id: number) =>
    http.put<void>(`/Region/Enable/${id}`, {}),

  disable:     (id: number) =>
    http.put<void>(`/Region/Disable/${id}`, {}),
}
```

---

## 十、非功能需求

| 指标 | 要求 |
|---|---|
| 首屏加载 | 树形数据加载时间 < 1s（接口响应 < 500ms） |
| 展开性能 | 节点数 ≤ 500 时展开无明显卡顿 |
| 操作反馈 | 所有异步操作的 loading 状态在 100ms 内显示 |
| 响应式 | 最低支持 1280px 宽度桌面浏览器 |

---

## 十一、边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 删除有子节点的区域 | 操作按钮 disabled，Tooltip 提示"请先删除子级区域"；服务端也会拦截并返回业务异常 |
| `ParentId` 设置为自身 | 前端选择器过滤掉自身 Id；服务端将其自动修正为 0 |
| 层级超出枚举范围 | Select 只提供 0/1/2 三个选项，无法输入非法值 |
| 网络请求失败 | 表格区域显示 Error State，提供"重试"按钮重新拉取树形数据 |
| 并发编辑 | 打开编辑 Drawer 时重新请求详情接口，避免使用脏缓存数据 |

---

## 十二、关联模块

| 模块 | 关联关系 |
|---|---|
| 用户管理页（User） | 用户绑定组织时调用 `GET /api/Region/selector` 获取区域选项 |
| 角色管理页（Role） | 间接依赖：角色的 DataRange 以区域为作用域边界 |
| 菜单权限管理页 | 无直接依赖 |

---

*文档维护：请在功能完成后将状态修改为"已完成"并更新 `最后更新` 日期。*

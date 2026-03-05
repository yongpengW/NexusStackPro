# PRD：角色管理页面（Role Management）

> 文档版本：V1.0  
> 创建日期：2026-03-02  
> 所属模块：系统管理 → 角色管理  
> 对应后端控制器：`RoleController`  
> UI 规范：参见 [UI-Standards.md](./UI-Standards.md)  
> 文档状态：**已完成**  
> 最后更新：2026-03-02

---

## 一、页面概述

### 1.1 业务背景

角色是 RBAC 权限体系的核心中间层：**用户 → 角色 → 菜单权限**。一个角色可绑定到一个或多个平台（`PlatformType` Flags 枚举），不同平台的菜单树完全隔离。用户最终有效权限为其所有角色的**并集**。

**系统内置角色**（`IsSystem = true`）：禁止修改名称/Code/平台属性，禁止禁用，禁止删除。前端需在 UI 层面视觉标注并屏蔽危险操作。

**权限配置入口**：角色管理列表中，每个角色有"配置权限"操作，打开权限配置 Drawer，以树形勾选的方式绑定菜单节点（即该角色可访问的菜单/操作）。

### 1.2 页面目标

- 提供角色的增删改查、启用/禁用功能；
- 支持按平台过滤角色列表；
- 提供角色权限配置入口（菜单树勾选，支持按平台切换）；
- 系统内置角色有明显标注，且受保护操作不可触发。

### 1.3 适用用户

| 角色 | 操作权限 |
|---|---|
| 超级管理员 | 全部操作（含查看超级管理员角色） |
| 系统管理员 | 查看（不含超级管理员角色）、新增、编辑普通角色、配置权限 |

> 非超级管理员无法查看 Code 为 `ROOT` 的超级管理员角色，后端已过滤。

---

## 二、页面布局

### 2.1 整体结构

```
┌──────────────────────────────────────────────────────────────────────┐
│  平台筛选 Tab：[全部] [超管] [PC端] [小程序] [App]                   │
├──────────────────────────────────────────────────────────────────────┤
│  搜索栏：[关键词____________] [状态▼]  [搜索] [重置]   [+ 新增角色] │
├──────────────────────────────────────────────────────────────────────┤
│  角色名称       Code        平台标签    排序  系统角色  状态   操作  │
│  超级管理员  ROOT    [超管]         1    [系统]    启用   配置权限 更多▼  │
│  PC端运营    pc_ops  [PC端]         2             启用   配置权限 编辑 更多▼  │
│  ...                                                                   │
├──────────────────────────────────────────────────────────────────────┤
│                            分页：< 1 2 3 ... >                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 布局说明

- 顶部平台筛选用 `Tabs` 或 `Radio.Group` 实现，切换时重新请求列表（传对应 `platformType`）；
- 系统内置角色行显示橙色 `[系统]` 徽标；
- 系统角色行的编辑、禁用、删除按钮全部 disabled，Tooltip 提示"系统内置角色不可修改"；
- 操作列"更多"下拉收纳低频操作（禁用/启用、删除）。

---

## 三、功能需求

### 3.1 角色列表展示

**接口**：`GET /api/Role/list/{platformType}`（`platformType=0` 表示全部）

**查询参数**：

| 参数 | 说明 |
|---|---|
| `keyword` | 模糊匹配 Name / Code / Remark |
| `isEnable` | bool?，状态筛选 |
| `page` / `limit` | 分页 |

**展示字段**：

| 列名 | 字段 | 说明 |
|---|---|---|
| 角色名称 | `name` | - |
| Code | `code` | - |
| 所属平台 | `platforms` | 将 Flags 值拆解为多个 Tag（见平台 Tag 颜色规范） |
| 排序 | `order` | - |
| 系统角色 | `isSystem` | `true` 时显示橙色 Badge `[系统]` |
| 状态 | `isEnable` | 绿色"启用" / 灰色"禁用" |
| 操作 | - | 见第 3.5 节 |

**平台 Tag 颜色方案**（与用户管理保持一致）：

| 平台 | 值 | Tag 颜色 |
|---|---|---|
| Admin | 1 | `red` |
| Pc | 2 | `blue` |
| Mini | 4 | `green` |
| Android | 8 | `orange` |

> Flags 拆解示例：`platforms = 3`（Admin + Pc）→ 显示两个 Tag：`[超管]` `[PC端]`

### 3.2 平台筛选 Tab

| Tab | `platformType` 值 | 说明 |
|---|---|---|
| 全部 | 0 | 不过滤平台 |
| 超管 | 1 | 只展示含 Admin 平台的角色 |
| PC端 | 2 | 只展示含 Pc 平台的角色 |
| 小程序 | 4 | 只展示含 Mini 平台的角色 |
| App | 8 | 只展示含 Android 平台的角色 |

### 3.3 新增角色

**接口**：`POST /api/Role`  
**触发入口**：搜索栏右侧"新增角色"按钮  
**交互形式**：右侧 Drawer（宽度 480px）

**表单字段**：

| 字段 | 组件 | 必填 | 校验规则 |
|---|---|---|---|
| 角色名称 | Input | ✅ | 不能为空，最大 64 字符 |
| 角色 Code | Input | ✅ | 不能为空，最大 64 字符，建议英文下划线 |
| 所属平台 | Checkbox.Group | ✅ | 至少选择 1 个平台 |
| 排序 | InputNumber | ✅ | 默认 0，非负整数 |
| 是否启用 | Switch | ✅ | 默认开启 |
| 备注 | TextArea | ❌ | 最大 512 字符 |

> `IsSystem` 字段固定为 `false`，前端不显示该选项。

### 3.4 编辑角色

**接口**：`GET /api/Role/{id}`（回显）、`PUT /api/Role/{id}`（保存）

**特殊说明**：
- 系统内置角色（`isSystem = true`）打开编辑 Drawer 时所有字段 **只读**，底部仅显示"关闭"按钮；
- 禁用中的角色编辑时，若当前有用户绑定则无法将 `isEnable` 改为 `false`（服务端校验，前端同步展示错误提示）；
- 编辑保存后，后端自动使该角色下所有用户的权限缓存失效（前端无需额外处理）。

### 3.5 操作按钮

| 操作 | 显示条件 | 说明 |
|---|---|---|
| **配置权限** | 始终显示 | 打开权限配置 Drawer（见第 3.6 节） |
| **编辑** | 始终显示 | 系统角色时 Drawer 内字段只读 |
| **启用** | `isEnable = false` 且非系统角色 | 直接调用 |
| **禁用** | `isEnable = true` 且非系统角色 | Popconfirm 确认；有用户绑定时服务端拒绝 |
| **删除** | 非系统角色 | Popconfirm 确认；有用户绑定时服务端拒绝 |

### 3.6 角色权限配置

**接口**：
- `GET /api/Role/permission?roleId=xxx&platformType=xxx`（获取当前权限）
- `POST /api/Role/permission/{roleId}`（保存权限）

**触发入口**：操作列"配置权限"  
**交互形式**：右侧 Drawer（宽度 600px）

**权限配置 Drawer 布局**：

```
┌────────────── 配置权限：PC端运营专员 ──────── [×] ┐
│                                                     │
│  平台：[PC端  ▼]   [展开全部] [收起全部]            │
│                                                     │
│  ├─ ☑ 系统管理                                     │
│  │  ├─ ☑ 用户管理       ☑ 查看  ☑ 新增  □ 删除   │
│  │  ├─ ☑ 角色管理       ☑ 查看  □ 新增  □ 删除   │
│  │  └─ □ 区域管理       □ 查看  □ 新增  □ 删除   │
│  └─ □ 数据报表                                     │
│     └─ □ 销售看板       □ 查看                     │
│                                                     │
│  父子关联规则：勾选子节点自动勾选父节点；           │
│               取消父节点自动取消所有子节点。         │
│                                                     │
│                       [取消]  [保存权限]            │
└─────────────────────────────────────────────────────┘
```

**权限树说明**：
- 菜单树数据来自 `GET /api/Role/permission?roleId=xxx&platformType=xxx`，返回 `PermissionDto[]` 树形结构（包含**全量**菜单节点，每个节点通过 `hasPermission` 字段标记当前角色是否持有该权限）；
- 树节点含 `MenuType`：`Subsystem(1)` / `Directory(2)` / `Menu(3)` / `Operation(4)`；
- `Operation` 类型节点为叶子节点（按钮级权限），展示在所属菜单行内联；
- 已有权限的节点预先勾选（通过 `HasPermission` 或与当前权限 id 列表对比判断）；
- Drawer 内顶部可按**平台**切换查看/配置不同平台的权限树；
- 保存时将选中的菜单 Id 数组一次性提交 `POST /api/Role/permission/{roleId}`。

---

## 四、接口清单

| # | 方法 | 路径 | 功能 | 使用时机 |
|---|---|---|---|---|
| 1 | GET | `/api/Role/list/{platformType}` | 角色分页列表 | 页面初始化、搜索、翻页、切换平台 Tab |
| 2 | GET | `/api/Role/selector` | 角色选择器数据 | 用户管理等他处使用 |
| 3 | GET | `/api/Role/{id}` | 角色详情 | 打开编辑 Drawer |
| 4 | POST | `/api/Role` | 新增角色 | 新增 Drawer 提交 |
| 5 | PUT | `/api/Role/{id}` | 编辑角色 | 编辑 Drawer 提交 |
| 6 | PUT | `/api/Role/enable/{id}` | 启用角色 | 点击"启用"操作 |
| 7 | PUT | `/api/Role/disable/{id}` | 禁用角色 | 点击"禁用"确认后 |
| 8 | DELETE | `/api/Role/{id}` | 删除角色 | 点击"删除"确认后 |
| 9 | GET | `/api/Role/permission` | 获取全量菜单树及角色权限状态（含 `hasPermission`） | 打开权限配置 Drawer |
| 10 | POST | `/api/Role/permission/{roleId}` | 保存角色权限 | 权限配置 Drawer 保存 |

---

## 五、数据模型

### 5.1 展示数据（RoleDto）

```typescript
interface RoleDto {
  id: number;
  name: string;
  code: string;
  isSystem: boolean;
  order: number;
  remark: string;
  isEnable: boolean;
  platforms: PlatformType;   // Flags 位掩码
}

// PlatformType Flags 枚举
enum PlatformType {
  All     = 0,   // 查询用，不存库
  Admin   = 1,
  Pc      = 2,
  Mini    = 4,
  Android = 8,
}
```

### 5.2 创建/编辑请求体（CreateRoleDto）

```typescript
interface CreateRoleDto {
  name: string;       // 必填，最大 64 字符
  code: string;       // 必填，最大 64 字符
  platforms: number;  // PlatformType Flags 求和值
  order?: number;     // 默认 0
  isEnable: boolean;  // 默认 true
  isSystem?: boolean; // 固定 false，由前端强制不传或传 false
  remark?: string;
}
```

### 5.3 权限配置数据（PermissionDto / ChangeRolePermissionDto）

> 由 `GET /api/Role/permission` 返回，包含**全量**菜单树节点，每个节点通过 `hasPermission` 标记当前角色是否持有该权限，同时附带 `dataRange`。  
> 对应后端：`NexusStack.Core.Dtos.Permissions.PermissionDto` / `ChangeRolePermissionDto`

```typescript
enum DataRange {
  All                    = 0, // 全部数据
  CurrentAndSubLevels    = 1, // 本级及下级
  CurrentLevel           = 2, // 本级
  CurrentAndParentLevels = 3, // 本级及上级
  Self                   = 4, // 仅本人
}

interface PermissionDto {
  id: number;               // 主键（来自 DtoBase）
  roleId: number;           // 权限所属角色 Id
  menuId: number;           // 菜单节点 Id
  menuName: string;         // 菜单名称
  menuParentId: number;     // 父级菜单 Id
  menuUrl: string;          // 菜单路由（Menu 类型有值）
  menuType: MenuType;       // 1=子系统 2=目录 3=菜单 4=操作
  menuOrder: number;        // 菜单排序
  hasPermission: boolean;   // 当前角色是否已拥有此权限（根据 Permission 记录是否存在计算得出）
  dataRange: DataRange;     // 数据范围，Directory / Subsystem 固定为 All
  children?: PermissionDto[];    // 子目录/子菜单（树节点递归）
  operations?: PermissionDto[];  // 按钮级操作权限（内联展示，不参与树展开）
}

interface MenuPermissionItem {
  menuId: number;
  dataRange: DataRange;
}

interface ChangeRolePermissionDto {
  roleId: number;
  platformType?: PlatformType;  // 可选，对应后端 PlatformType?
  /**
   * 选中的所有菜单权限项，必须同时包含：
   *   1. checkedKeys       —— Tree 完全勾选的节点
   *   2. halfCheckedKeys   —— Tree 半选（indeterminate）的父节点
   * 半选节点表示"该目录/菜单下有部分子权限被授权"，后端同样需要为其创建 Permission 记录。
   * 前端实现：
   *   const allMenuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))
   *   menus = allMenuIds.map(menuId => ({
   *     menuId,
   *     dataRange: dataRangeMap[menuId] ?? DataRange.All,
   *   }))
   */
  menus: MenuPermissionItem[];   // 选中的菜单权限集合（对应后端 ChangeRolePermissionDto.Menus）
}
```

---

## 六、权限树交互规范

### 6.1 父子联动

| 操作 | 行为 |
|---|---|
| 勾选子节点 | 自动勾选其所有父节点（直到根节点） |
| 取消父节点 | 自动取消其所有子节点（递归） |
| 半选状态 | 父节点子节点部分勾选时显示 `indeterminate` 状态 |

### 6.2 按平台切换

- 默认显示角色所属平台中第一个平台的权限树；
- 切换平台后重新请求对应平台的权限树数据；
- 当前未保存的修改切换时给予提示："切换平台将丢失未保存的修改，确认切换？"。

### 6.3 保存逻辑

- 收集所有选中的 `menuId`（含半选的目录/分组节点），组装为 `{ roleId, platformType, menus: MenuPermissionItem[] }` 提交，其中 `menus` 按照第 5.3 节的规则填充 `dataRange`；
- 后端按 `roleId + platformType` 维度全量替换该角色在该平台下的权限，并自动补齐未在请求体中的上级节点记录；
- 保存成功后后端自动使受影响用户缓存失效，前端关闭 Drawer 并显示 `message.success('权限配置保存成功')`。

---

## 七、交互规范

### 7.1 loading 状态

| 操作 | loading 范围 |
|---|---|
| 页面初始化 / 搜索 / 切换 Tab | 整个表格区域 spin |
| 打开编辑 Drawer | Drawer 内 spin（等待详情接口） |
| 启禁用 / 删除 | 对应行操作按钮 loading |

### 7.2 消息反馈

| 操作 | 成功提示 | 失败提示 |
|---|---|---|
| 新增角色 | `message.success('角色创建成功')` | Drawer 内 Alert |
| 编辑角色 | `message.success('保存成功')` | Drawer 内 Alert |
| 启用 | `message.success('已启用')` | `message.error(...)` |
| 禁用 | `message.success('已禁用')` | `message.error(服务端原因，如"该角色正在使用中")` |
| 删除 | `message.success('删除成功')` | `message.error(服务端原因)` |
| 保存权限（在权限管理页） | `message.success('权限配置保存成功')` | `message.error(...)` |

---

## 八、字段校验规范

| 字段 | 规则 | 错误提示 |
|---|---|---|
| 角色名称 | 必填，最大 64 字符 | "角色名称不能为空" / "最多 64 个字符" |
| 角色 Code | 必填，最大 64 字符 | "角色代码不能为空" / "最多 64 个字符" |
| 所属平台 | 必选，至少 1 个 | "请选择所属平台" |
| 排序 | 非负整数 | "请输入有效的排序值" |

---

## 九、边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 禁用/删除有用户绑定的角色 | 操作按钮不做前端 disabled（后端校验），失败时 `message.error('该角色正在使用中，无法禁用/删除')` |
| 修改/禁用/删除系统内置角色 | 按钮全部 disabled，Tooltip 提示"系统内置角色不可操作"；服务端也有兜底拦截 |
| 权限树无数据 | 显示"该平台暂无菜单，请先在菜单管理中添加菜单"提示 |
| 权限配置切换平台未保存 | 弹出确认弹窗，取消则保留当前状态 |

---

## 十、前端文件规划

```
src/pages/system/role/
├── index.tsx              # 页面主文件（分页表格 + 搜索栏 + 平台 Tab）
├── RoleDrawer.tsx         # 新增/编辑 Drawer
└── useRole.ts             # 数据逻辑 Hook（列表查询、增删改等）

src/services/role.ts       # Role 相关 API 封装
```

### 10.1 services/role.ts 接口封装

> GET 参数必须用 `buildUrl` 拼入 URL，详见 [UI-Standards.md §2](./UI-Standards.md)

```typescript
// src/services/role.ts
import { http, buildUrl } from '@/utils/request'

export const RoleApi = {
  getList: (platformType: number, params?: {
    page?: number; limit?: number; keyword?: string; isEnable?: boolean
  }) =>
    http.get<IPagedList<RoleDto>>(buildUrl(`/Role/list/${platformType}`, params)),

  getSelector: () =>
    http.get<SelectOptionDto[]>('/Role/selector'),

  getById: (id: number) =>
    http.get<RoleDto>(`/Role/${id}`),

  create: (data: CreateRoleDto) =>
    http.post<number>('/Role', data),

  update: (id: number, data: CreateRoleDto) =>
    http.put<void>(`/Role/${id}`, data),

  remove: (id: number) =>
    http.delete<void>(`/Role/${id}`),

  enable: (id: number) =>
    http.put<void>(`/Role/enable/${id}`, {}),

  disable: (id: number) =>
    http.put<void>(`/Role/disable/${id}`, {}),
}
```

---

## 十一、关联模块

| 模块 | 关联关系 |
|---|---|
| 用户管理（User） | 用户绑定角色时用 Role 选择器数据 |
| 菜单管理（Menu） | 权限配置以菜单树为配置基础 |
| RBAC 缓存机制 | 角色权限变更后自动失效受影响用户的 Redis 权限缓存 |

---

*文档维护：后续有变更时请更新 `最后更新` 日期。*

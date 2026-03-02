# PRD：权限管理页面（Permission Management）

> 文档版本：V1.0  
> 创建日期：2026-03-02  
> 所属模块：系统管理 → 权限管理  
> 对应后端控制器：`RoleController`（权限配置）、`MenuController`（API 绑定）、`TokenController`（当前用户权限）  
> UI 规范：参见 [UI-Standards.md](./UI-Standards.md)  
> 文档状态：**已完成**  
> 最后更新：2026-03-02

---

## 一、页面概述

### 1.1 业务背景

权限管理页面是整个 RBAC 体系的**核心配置工作台**，负责两件事：

1. **角色-菜单权限赋予**：决定"某角色在某平台下可以访问哪些菜单和操作（按钮）"；
2. **菜单-API 资源绑定**：决定"角色拥有某菜单权限时，哪些后端接口被同步授权"（接口级动态鉴权的关键）。

两者共同构成完整的授权链路：

```
用户 → 角色 → 菜单权限（本页配置）→ API 资源绑定（菜单管理配置，本页只读查看）→ 接口访问授权（缓存驱动）
```

**与角色管理的区别**：角色管理（Role-Management.md）中提供了一个轻量"配置权限 Drawer"作为快捷入口。本页面是**专用全屏权限工作台**，提供更完整的上下文：菜单树全量可见、操作级权限内联展示、API 绑定状态直观呈现，适合系统初始化或大批量权限配置场景。

### 1.2 页面目标

- 以左右分栏布局提供直观的权限配置视图；
- 支持角色 + 平台联合选择，实时加载对应权限树；
- 菜单树与按钮级操作权限（`Operation`）统一呈现，父子联动勾选；
- 每个 `Operation` 节点下可展开**只读查看**已绑定的 API 资源（修改入口在菜单管理页面）；
- 保存时触发后端缓存失效，权限变更对用户实时生效。

### 1.3 适用用户

| 角色 | 操作权限 |
|---|---|
| 超级管理员 | 配置所有角色权限（含 ROOT 角色的菜单查看） |
| 系统管理员 | 配置非系统内置角色的权限 |

---

## 二、页面布局

### 2.1 整体结构（左右分栏）

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  页面标题：权限管理                                                               │
├─────────────────────┬────────────────────────────────────────────────────────────┤
│  左栏（角色选择）    │  右栏（权限配置区）                                         │
│                     │                                                              │
│  平台：[PC端  ▼]    │  配置角色：PC端运营专员                平台：PC端            │
│                     │  [展开全部] [收起全部] [全选] [清空]         [保存权限]      │
│  搜索角色：[____]   ├──────────────────────────────────────────────────────────  │
│                     │  权限树                                                      │
│  ○ 超级管理员 [系统] │  ├─ ☑ 管理端（子系统）                                     │
│  ● PC端运营专员     │  │  ├─ ☑ 系统管理（目录）                                  │
│  ○ 移动端用户       │  │  │  ├─ ☑ 用户管理（菜单）                               │
│  ○ 数据分析师       │  │  │  │    操作：☑ 查看用户  ☑ 新增用户  □ 删除用户       │
│                     │  │  │  │    └─[展开 API 绑定] GET api/user/list            │
│                     │  │  │  ├─ ☑ 角色管理（菜单）                               │
│                     │  │  │  └─ □ 区域管理（菜单）                               │
│                     │  │  └─ □ 数据报表（目录）                                  │
│                     │  │     └─ □ 销售看板（菜单）                               │
└─────────────────────┴────────────────────────────────────────────────────────────┘
```

### 2.2 布局说明

- 左栏宽度固定 240px，超出时滚动，通过搜索框过滤角色；
- 右栏自适应剩余宽度，内容区可独立滚动；
- 左栏选中角色高亮，右栏权限树随选中角色 + 当前平台实时更新；
- 系统内置角色（`isSystem = true`）在左栏显示橙色 `[系统]` 标记，选中后右栏所有勾选框 **只读**（可查看但不可修改）；
- 右栏顶部平台切换时，若有未保存修改弹出确认弹窗。

---

## 三、功能需求

### 3.1 左栏：角色列表

**数据来源**：`GET /api/Role/list/{platformType}`（根据顶部平台选择器联动过滤）

**交互说明**：
- 默认选中第一个非系统角色；
- 搜索框实时过滤（前端过滤已加载数据，无需重新请求）；
- 点击切换角色时，若右栏有未保存的权限修改，弹出确认："当前角色权限尚未保存，切换后将丢失修改，确认切换？"；
- 系统角色可正常点击查看，但右栏自动进入**只读模式**（所有勾选框 disabled，"保存权限"按钮隐藏）。

### 3.2 平台切换

页面顶部（或左栏顶部）提供平台选择器（单选）：

| 平台 | `PlatformType` 值 |
|---|---|
| 超管 | 1 |
| PC端 | 2 |
| 小程序 | 4 |
| App | 8 |

切换平台时：
1. 左栏角色列表重新加载（按新平台过滤）；
2. 右栏权限树重新加载（按新角色 + 新平台拉取）；
3. 有未保存修改时先弹确认弹窗。

### 3.3 右栏：权限树

**接口**：`GET /api/Role/permission?roleId=xxx&platformType=xxx`

**返回数据**：`PermissionDto[]` 树形结构，每个节点含：
- `menuId`、`menuName`、`menuType`（Subsystem/Directory/Menu/Operation）
- `hasPermission`：当前角色是否已拥有该权限
- `children`：子目录/子菜单（树节点）
- `operations`：归属于该菜单节点的操作按钮（Operation 类型，内联展示）

**展示规则**：

| 节点类型 | 渲染方式 | 勾选联动 |
|---|---|---|
| Subsystem（子系统） | 树节点（行） | 勾选/取消递归影响所有子孙节点 |
| Directory（目录） | 树节点（行，可折叠） | 同上 |
| Menu（菜单） | 树节点（行，可折叠） | 同上 |
| Operation（操作） | **内联** 展示在所属 Menu 行下方 | 独立勾选；勾选任意 Operation 自动勾选父 Menu |

**权限树交互规范（父子联动）**：

| 操作 | 联动行为 |
|---|---|
| 勾选子节点 | 沿祖先路径向上自动勾选所有父节点 |
| 取消父节点 | 递归取消其下所有子节点和 Operation |
| 父节点子节点部分勾选 | 父节点显示 `indeterminate`（半选）状态 |
| 全选按钮 | 勾选当前平台下所有菜单节点 |
| 清空按钮 | 取消所有勾选（弹出确认） |

**工具栏快捷操作**（右栏顶部）：

| 按钮 | 功能 |
|---|---|
| 展开全部 | 展开树的所有层级 |
| 收起全部 | 仅显示第一层节点 |
| 全选 | 勾选所有可见节点 |
| 清空 | 取消所有勾选（弹 Popconfirm） |
| 保存权限 | 提交当前勾选状态 |

### 3.4 Operation 节点的 API 绑定展示

在权限树中，每个 `Operation` 类型节点（按钮级权限）可展开查看其已绑定的 API 资源。这是"可选的增强视图"，帮助管理员理解"勾选这个操作权限，背后授权了哪些接口"。

**展示形式**：Operation 行末添加"查看 API 绑定"链接（默认折叠），点击后在当前行下方内联展开：

```
  ├─ ☑ 新增用户 (Operation)                          [查看 API 绑定 ∧]
  │    ▸ POST  api/user                  创建用户
  │    ▸ GET   api/role/selector         角色选择器
  │    ▸ GET   api/region/selector       区域选择器
```

**数据来源**：`GET /api/Menu/{id}/Resources`（仅在首次展开时请求，之后本地缓存）

**注意**：此处是**只读展示**，API 绑定的修改入口在**菜单管理（Menu Management）**页面，以保持职责分离。

> 如需快捷入口，可在展开的 API 列表右上角添加"去菜单管理绑定"的外链按钮，跳转至菜单管理页并定位到该 Operation 节点。

### 3.5 保存权限

**接口**：`POST /api/Role/permission/{roleId}`

**请求体**（与后端 `ChangeRolePermissionDto` 对齐）：
```json
{
  "roleId": 5,
  "platformType": 2,
  "menus": [
    { "menuId": 1,  "dataRange": 0 },
    { "menuId": 2,  "dataRange": 0 },
    { "menuId": 3,  "dataRange": 1 },
    { "menuId": 10, "dataRange": 4 },
    { "menuId": 11, "dataRange": 4 },
    { "menuId": 20, "dataRange": 0 }
  ]
}
```

**提交逻辑**：
1. 收集所有 `checked` 状态的节点 menuId（包含 `indeterminate` 的目录/菜单节点，因为它们有部分子权限被选中），得到去重集合 `allMenuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))`；
2. 对于每个 `menuId` 生成一条 `{ menuId, dataRange }`，其中：
   - Menu / Operation 节点的 `dataRange` 取自当前 `dataRangeMap[menuId]`，若未设置则默认为 `DataRange.All(0)`；
   - 半选父节点（仅在 `halfCheckedKeys` 中出现）的 `dataRange` 固定为 `DataRange.All(0)`；
3. 后端按 `roleId + platformType` 维度**全量替换**该角色在该平台下的 `Permission` 记录（包括目录/菜单/操作节点），并自动补齐未在请求体中的上级节点记录；
4. 后端自动使持有该角色的所有用户的权限缓存失效（Redis `InvalidateAsync`）；
5. 成功后右栏显示 `message.success('权限保存成功，已实时生效')`，并重新请求权限树以同步服务端状态。

**提交范围说明**：

> ⚠️ **重要设计决策（已确认，禁止修改）**  
> `halfCheckedKeys`（半选节点）**必须合并进最终提交的 `menus` 数组**。  
> 半选状态表示该目录/菜单节点下有部分子权限被授权，其本身也属于"有此菜单权限"的语义范畴。  
> 后端按 menuId 存记录，不区分"全选"与"半选"，只要记录存在即视为有该菜单权限。  
> **前端实现**：`const allMenuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))`  
> 并为每个 `menuId` 生成 `{ menuId, dataRange }`；  
> **不得**只传 `checkedKeys` 而丢弃 `halfCheckedKeys`，否则父级目录权限丢失，前端侧边栏将无法渲染对应目录节点。

- `indeterminate`（半选）状态的目录/菜单节点**必须包含**在提交的 `menus` 数组中（见上方说明）；
- Operation 节点独立计入 `menus`，不依附父 Menu 节点的选中状态；
- 若 `menus` 数组为空，代表清空该角色在该平台的所有权限（服务端支持此操作）。

---

## 四、接口清单

| # | 方法 | 路径 | 功能 | 使用时机 |
|---|---|---|---|---|
| 1 | GET | `/api/Role/list/{platformType}` | 加载左栏角色列表 | 页面初始化、切换平台 |
| 2 | GET | `/api/Role/permission` | 获取角色权限树（含 `hasPermission` 标记） | 选中角色或切换平台时 |
| 3 | POST | `/api/Role/permission/{roleId}` | 保存角色权限 | 点击"保存权限" |
| 4 | GET | `/api/Menu/{id}/Resources` | 查看 Operation 节点已绑定的 API 资源 | 首次展开"查看 API 绑定"时 |
| 5 | GET | `/api/Token/permission` | 获取当前登录用户的菜单权限树 | **仅供前端布局渲染侧边栏使用，本页不直接调用** |

> **接口 5 说明**：`GET /api/Token/permission?platformType=xxx` 是给**登录用户前端侧边栏渲染**用的（返回当前用户有权限的菜单树）。权限管理页面本身不调用此接口，而是通过 `GET /api/Role/permission` 以指定角色视角查看权限。两者数据结构不同：前者是 `RolePermissionDto`（无 hasPermission 字段），后者是 `PermissionDto`（含 hasPermission 字段）。

---

## 五、数据模型

### 5.1 权限树节点（PermissionDto）

```typescript
interface PermissionDto {
  id: number;
  roleId: number;
  menuId: number;
  menuName: string;
  menuParentId: number;
  menuUrl: string;
  menuType: MenuType;       // 1=Subsystem 2=Directory 3=Menu 4=Operation
  menuOrder: number;
  /**
   * 当前角色是否持有该权限。
   * ⚠️ 重要说明（禁止删除此字段）：
   * 后端数据库 Permission 表不存储此布尔字段（有记录即有权限），
   * 但 API 响应中此字段是计算属性（= Permission 记录是否存在），
   * 前端权限树依赖此值初始化 checkedKeys，缺失将导致已有权限无法回显。
   */
  hasPermission: boolean;
  children?: PermissionDto[];   // 子目录/子菜单（树节点递归）
  operations?: PermissionDto[]; // 按钮级权限（内联展示，不参与树展开）
}
```

> ✅ **DataRange（数据范围）V1 已实现**：  
> - `PermissionDto` 含 `dataRange: DataRange` 字段（`All=0 / CurrentAndSubLevels=1 / CurrentLevel=2 / CurrentAndParentLevels=3 / Self=4`）；  
> - 权限配置页对 **Menu / Operation** 节点在勾选时显示"数据范围"下拉选择器；  
> - **Directory / Subsystem** 节点不展示，保存时固定 `All(0)`（此类节点不涉及数据过滤语义）；  
> - 角色管理 PermissionDrawer（快捷入口）不展示 DataRange UI，但提交时携带已还原的数据范围值，不覆盖权限管理页的精细配置。

### 5.2 保存权限请求体（ChangeRolePermissionDto）

```typescript
enum DataRange {
  All                    = 0, // 全部数据
  CurrentAndSubLevels    = 1, // 本级及下级
  CurrentLevel           = 2, // 本级
  CurrentAndParentLevels = 3, // 本级及上级
  Self                   = 4, // 仅本人
}

interface MenuPermissionItem {
  menuId: number
  dataRange: DataRange
}

interface ChangeRolePermissionDto {
  roleId: number;
  platformType?: PlatformType;
  /**
   * 选中的所有菜单权限项，必须同时包含：
   *   1. checkedKeys       —— Tree 完全勾选的节点
   *   2. halfCheckedKeys   —— Tree 半选（indeterminate）的父节点
   * 半选节点表示"该目录/菜单下有部分子权限被授权"，后端同样需要为其创建 Permission 记录。
   * 若只传 checkedKeys 丢弃 halfCheckedKeys，前端侧边栏将因缺少父目录权限记录而无法渲染目录节点。
   * 前端实现：
   *   const allMenuIds = Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))
   *   menus = allMenuIds.map(menuId => ({
   *     menuId,
   *     // halfChecked 父节点不在 dataRangeMap 中，固定为 All
   *     dataRange: dataRangeMap[menuId] ?? DataRange.All,
   *   }))
   */
  menus: MenuPermissionItem[];
}
```

### 5.3 API 资源绑定数据（MenuResourceDto，只读展示）

```typescript
// 与菜单管理共用同一类型，详见 Menu-Management.md §5.3
// 对应后端：NexusStack.Core.Dtos.Menus.MenuResourceDto（自引用树形结构）
interface MenuResourceDto {
  id: number;
  name: string;          // 控制器名称（分组）或 Action 名称（叶子）
  code: string;          // 控制器："NameSpace.ControllerName"；Action："routetemplate:HTTPMETHOD"
  routePattern: string;  // 路由模板
  isChecked: boolean;    // 是否已绑定（此处权限管理页面只读展示）
  operations?: MenuResourceDto[];  // 叶子节点为 null/undefined
}
```

---

## 六、前端状态管理设计

权限管理页面涉及多维状态，建议在专用 Hook 中统一管理：

```typescript
// usePermission.ts 状态结构示意
interface PermissionPageState {
  // 左栏
  platformType: PlatformType;        // 当前平台
  roleList: RoleDto[];               // 已加载的角色列表
  selectedRoleId: number | null;     // 当前选中角色

  // 右栏
  permissionTree: PermissionDto[];   // 原始权限树（从后端加载）
  checkedKeys: number[];             // 当前勾选的 menuId 集合
  halfCheckedKeys: number[];         // 半选 menuId 集合（提交时必须合并进 checkedKeys，见 §3.5）
  isDirty: boolean;                  // 是否有未保存的修改

  // 展开的 API 绑定（惰性加载）
  expandedApiBindings: Record<number, MenuResourceDto[]>; // menuId → API列表缓存（MenuResourceDto 见 §5.3）
}
```

### 6.1 数据初始化流程

```
1. 页面挂载
   └─ 请求 GET /api/Role/list/{platformType=1（默认超管）}
      └─ 自动选中第一个非系统角色
         └─ 请求 GET /api/Role/permission?roleId=xxx&platformType=1
            └─ 将 hasPermission=true 的 menuId 填充到 checkedKeys
               └─ 渲染权限树（isDirty = false）

2. 切换角色或平台
   ├─ isDirty = true → 弹确认弹窗
   └─ isDirty = false → 直接执行步骤 1 中 "请求权限树" 之后的流程
```

---

## 七、交互规范

### 7.1 loading 状态

| 操作 | loading 范围 |
|---|---|
| 页面初始化 | 左栏角色列表 + 右栏权限树同时 spin |
| 切换角色 / 切换平台 | 右栏权限树区域 spin（左栏保持稳定） |
| 点击"保存权限" | "保存权限"按钮 loading，权限树区域覆盖半透明蒙层（防重复点击） |
| 展开 API 绑定 | 对应 Operation 行的展开区域内 inline spin |

### 7.2 消息反馈

| 操作 | 成功提示 | 失败提示 |
|---|---|---|
| 保存权限 | `message.success('权限保存成功，已实时生效')` | `message.error(服务端错误)` |
| 切换角色/平台（有未保存修改） | - | Popconfirm 拦截 |
| 清空所有权限 | `message.success('已清空该角色权限')` | `message.error(...)` |

### 7.3 空状态处理

| 场景 | 展示内容 |
|---|---|
| 当前平台无角色 | 左栏显示"该平台暂无角色，请先在角色管理中创建" |
| 当前平台无菜单 | 右栏显示"该平台暂无菜单，请先在菜单管理中添加" |
| 系统角色权限树 | 右栏正常展示树（只读），顶部显示蓝色 Info Banner："系统内置角色权限不可修改" |

---

## 八、与其他页面的职责边界

| 功能 | 入口页面 | 说明 |
|---|---|---|
| 菜单节点增删改 | 菜单管理（Menu-Management） | 权限管理只读展示菜单树，不修改菜单本身 |
| Operation 节点绑定 API | 菜单管理（Menu-Management）→ 绑定接口 | 权限管理只读查看 API 绑定，修改须跳转菜单管理 |
| 角色-菜单权限配置（快捷） | 角色管理（Role-Management）→ 配置权限 Drawer | 角色管理中提供轻量 Drawer 入口；权限管理提供完整工作台 |
| 当前用户菜单渲染 | `GET /api/Token/permission`（前端布局层调用） | 与权限管理页面无关，在 MainLayout 初始化时调用 |

---

## 九、前端文件规划

```
src/pages/system/permission/
├── index.tsx              # 页面主文件（左右分栏布局）
├── RolePanel.tsx          # 左栏：角色列表 + 搜索 + 平台选择
├── PermissionTree.tsx     # 右栏：权限树（含 Operation 内联 + API 绑定展开）
└── usePermission.ts       # 全局状态 Hook

src/services/permission.ts # Permission 相关 API 封装
```

### 9.1 services/permission.ts 接口封装

> GET 参数必须用 `buildUrl` 拼入 URL，详见 [UI-Standards.md §2](./UI-Standards.md)

```typescript
// src/services/permission.ts
import { http, buildUrl } from '@/utils/request'

export const PermissionApi = {
  getRolePermission: (roleId: number, platformType: number) =>
    http.get<PermissionDto[]>(buildUrl('/Role/permission', { roleId, platformType })),

  saveRolePermission: (roleId: number, data: ChangeRolePermissionDto) =>
    http.post<void>(`/Role/permission/${roleId}`, data),

  getMenuResources: (menuId: number) =>
    http.get<MenuResourceDto[]>(`/Menu/${menuId}/Resources`),

  /** 当前用户菜单权限——供布局层（MainLayout）调用，权限管理页面本身不使用 */
  getCurrentUserPermission: (platformType: number) =>
    http.get<RolePermissionDto[]>(buildUrl('/Token/permission', { platformType })),
}
```

---

## 十、边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 系统内置角色选中 | 右栏所有勾选框 disabled，"保存权限"按钮隐藏，顶部显示只读提示 Banner |
| 保存时角色已被删除 | 服务端返回 404，前端显示错误并刷新左栏角色列表 |
| 切换角色/平台有未保存修改 | Popconfirm 拦截，用户确认后丢弃修改并切换 |
| 权限树节点数量超大 | 树组件配置虚拟滚动（virtual scroll），保证 500+ 节点时不卡顿 |
| 同时多个管理员操作同一角色 | 最后保存的覆盖前者（后端不做锁），前端无特殊处理 |

---

## 十一、关联模块

| 模块 | 关联关系 |
|---|---|
| 角色管理（Role-Management） | 权限 Drawer 是本页的轻量入口；本页是完整工作台 |
| 菜单管理（Menu-Management） | 权限树的菜单节点来源；API 绑定修改入口在菜单管理 |
| 用户管理（User-Management） | 用户通过角色间接获得菜单权限，修改后 Redis 缓存实时失效 |
| 前端布局层（MainLayout） | 通过 `GET /api/Token/permission` 获取侧边栏菜单，与本页无直接依赖 |

---

*文档维护：后续有变更时请更新 `最后更新` 日期。*

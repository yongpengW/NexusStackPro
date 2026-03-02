# PRD：菜单管理页面（Menu Management）

> 文档版本：V1.0  
> 创建日期：2026-03-02  
> 所属模块：系统管理 → 菜单管理  
> 对应后端控制器：`MenuController`  
> UI 规范：参见 [UI-Standards.md](./UI-Standards.md)  
> 文档状态：**待开发**

---

## 一、页面概述

### 1.1 业务背景

菜单管理是 RBAC 权限体系中定义"权限资源"的核心入口。菜单树的节点类型分为四层：**子系统 → 目录 → 菜单 → 操作（按钮级）**，覆盖了 UI 导航结构与细粒度功能权限。

每个菜单节点可以绑定若干后端 **API 资源**（`ApiResource`），绑定关系决定了"角色拥有该菜单权限时，后端哪些接口被同步授权"。这是实现**接口级动态鉴权**的关键配置步骤。

### 1.2 页面目标

- 提供菜单树的增删改查，支持多层级管理；
- 支持按平台（`PlatformType`）切换查看不同平台的菜单树；
- 提供"API 资源绑定"入口，可为每个菜单节点勾选关联的后端接口；
- 菜单属性变更（含 API 绑定变更）后，后端自动失效受影响用户的权限缓存。

### 1.3 菜单层级说明

| 类型 | 枚举值 | 典型用途 | 备注 |
|---|---|---|---|
| 子系统（Subsystem） | 1 | 顶级入口，如"管理端" | 无路由 |
| 目录（Directory） | 2 | 侧边栏分组，如"系统管理" | 无路由 |
| 菜单（Menu） | 3 | 可访问的页面，如"用户管理" | 有路由 URL |
| 操作（Operation） | 4 | 按钮级权限，如"新增用户" | 无路由，依附菜单节点 |

---

## 二、页面布局

### 2.1 整体结构

```
┌──────────────────────────────────────────────────────────────────────┐
│  平台筛选 Tab：[全部] [超管] [PC端] [小程序] [App]                   │
├──────────────────────────────────────────────────────────────────────┤
│  [展开全部] [收起全部]                            [+ 新增根菜单]     │
├──────────────────────────────────────────────────────────────────────┤
│  菜单树形表格                                                         │
│                                                                        │
│  名称           类型   图标   URL        排序  可见  平台   操作      │
│  ▼ 管理端      子系统  🏠    -          1     ✓    [超管] 编辑 新增子项 更多▼  │
│    ▼ 系统管理  目录    ⚙️    -          1     ✓    [超管] 编辑 新增子项 更多▼  │
│      ├ 用户管理 菜单   👥  /system/user 1     ✓    [超管] 编辑 新增子项 更多▼  │
│      │  ├ 新增用户 操作 -   -          1     -    [超管] 绑定接口 编辑 更多▼  │
│      │  └ 删除用户 操作 -   -          2     -    [超管] 绑定接口 编辑 更多▼  │
│      └ 角色管理 菜单   🎭  /system/role 2     ✓    [超管] 编辑 新增子项 更多▼  │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 布局说明

- 采用 Ant Design `Table` 的 `expandable` 属性实现树形表格；
- 平台 Tab 切换时重新请求 `GET /api/Menu/tree/{platformType}`；
- 节点类型不同，操作按钮略有差异（Operation 类型无"新增子项"，有"绑定接口"）；
- 不可见节点（`isVisible = false`）行以灰色半透明样式展示。

---

## 三、功能需求

### 3.1 菜单树展示

**接口**：`GET /api/Menu/tree/{platformType}`（`platformType=0` 时返回全部平台菜单）

**展示字段**：

| 列名 | 字段 | 说明 |
|---|---|---|
| 菜单名称 | `name` | - |
| 类型 | `type` | Subsystem/Directory/Menu/Operation 中文标签 |
| 图标 | `icon` | 展示图标（`iconType=Icon` 时用 AntD Icon，`iconType=Picture` 时用 img） |
| 路由 URL | `url` | Menu 类型才有值，其他类型显示 `-` |
| 排序 | `order` | 数字 |
| 可见 | `isVisible` | ✓ 图标 / ✗ 图标 |
| 平台 | `platformType` | 对应颜色 Tag |
| 操作 | - | 见第 3.5 节 |

### 3.2 平台筛选 Tab

与角色管理页面规范一致，`platformType=0` 时显示所有平台菜单（混合视图）。

### 3.3 新增菜单节点

**接口**：`POST /api/Menu`  
**触发入口**：顶部"新增根菜单"按钮 / 行操作"新增子项"  
**交互形式**：右侧 Drawer（宽度 520px）

**表单字段**：

| 字段 | 组件 | 必填 | 校验规则 / 说明 |
|---|---|---|---|
| 菜单名称 | Input | ✅ | 最大 256 字符 |
| 菜单 Code | Input | ✅ | 最大 256 字符，建议使用英文路径风格 |
| 所属平台 | Select | ✅ | 单选，选项：超管/PC端/小程序/App |
| 菜单类型 | Radio.Group | ✅ | 子系统(1) / 目录(2) / 菜单(3) / 操作(4) |
| 上级菜单 | Select（树形） | ❌ | 数据来自 `GET /api/Menu/selector`；根节点时值为 `0`（或 `null`） |
| 路由 URL | Input | 条件必填 | 类型为 Menu(3) 时必填 |
| 图标 | Input | ❌ | 图标名称或 URL |
| 图标类型 | Radio | ❌ | Icon(1) / Picture(2)，默认 Icon |
| 选中图标 | Input | ❌ | 可选，选中状态图标 |
| 排序 | InputNumber | ✅ | 默认 0 |
| 是否可见 | Switch | ✅ | 默认开启（Operation 类型固定不可见，隐藏此字段） |
| 是否外链 | Switch | ❌ | 默认关闭（仅 Menu 类型显示） |
| 备注 | TextArea | ❌ | 最大 1024 字符 |

**菜单类型联动规则**：

| 类型 | 上级菜单可选范围 | URL 字段 | 可见字段 |
|---|---|---|---|
| 子系统(1) | 无（根节点） | 隐藏 | 显示 |
| 目录(2) | 子系统节点 | 隐藏 | 显示 |
| 菜单(3) | 目录节点 | 显示，必填 | 显示 |
| 操作(4) | 菜单节点 | 隐藏 | 隐藏（固定 false） |

**新增子项时预填逻辑**：
- `ParentId` 预填为当前行 Id；
- `PlatformType` 继承父节点的平台；
- `Type` 根据父节点类型自动推断（父级+1，最大为 Operation(4)）。

### 3.4 编辑菜单节点

**接口**：`GET /api/Menu/{id}`（回显）、`PUT /api/Menu/{id}`（保存）

**特殊说明**：
- 编辑保存后，后端自动使持有该菜单权限的所有用户缓存失效；
- `ParentId` 选择框过滤掉自身及其所有子孙节点，防止形成循环引用；
- 菜单类型不建议修改（避免层级语义混乱），可在表单中对 `type` 字段给予 Warning 提示。

### 3.5 操作按钮

| 操作 | 显示节点类型 | 说明 |
|---|---|---|
| **编辑** | 所有类型 | 打开编辑 Drawer |
| **新增子项** | Subsystem / Directory / Menu | 打开新增 Drawer，预填 ParentId |
| **绑定接口** | Operation（操作级） | 打开 API 资源绑定 Drawer（见第 3.6 节） |
| **删除** | 所有类型 | Popconfirm 确认；有子节点时 disabled |

> 删除有子节点的菜单项：按钮 disabled，Tooltip 提示"请先删除子级菜单"；后端也有保护。

### 3.6 API 资源绑定

**接口**：
- `GET /api/Menu/{id}/Resources`（获取全部 API 资源及已绑定状态）
- `PUT /api/Menu/{id}/bind`（保存绑定，传 `long[]`）

**触发入口**：Operation 类型节点的"绑定接口"操作  
**交互形式**：右侧 Drawer（宽度 640px）

**API 资源绑定 Drawer 布局**：

```
┌──────────────── 绑定接口：新增用户 ──────── [×] ┐
│                                                   │
│  按控制器分组，每组一个 Panel                     │
│                                                   │
│  ▼ 用户管理（NexusStack.WebAPI.UserController）  │
│    ☑ GET  api/user/list         获取用户列表      │
│    ☑ POST api/user              创建用户          │
│    □ PUT  api/user/{id}         修改用户          │
│    □ DELETE api/user/{id}       删除用户          │
│                                                   │
│  ▶ 角色管理（NexusStack.WebAPI.RoleController）  │
│                                                   │
│  ▶ 区域管理（NexusStack.WebAPI.RegionController）│
│                                                   │
│                       [取消]  [保存绑定]          │
└───────────────────────────────────────────────────┘
```

**数据结构说明**：

后端返回 `MenuResourceDto[]`，使用**自引用树形结构**：父节点为控制器分组，`operations` 为该控制器下的所有 Action。  
对应后端：`NexusStack.Core.Dtos.Menus.MenuResourceDto`

```typescript
interface MenuResourceDto {
  id: number;
  name: string;          // 控制器名称（分组节点）或 Action 名称（叶子节点）
  code: string;          // 控制器："NameSpace.ControllerName"；Action："routetemplate:HTTPMETHOD"
  routePattern: string;  // 路由模板（如 "api/user/list"）
  isChecked: boolean;    // 是否已绑定到当前菜单节点
  operations?: MenuResourceDto[];  // 叶子节点此字段为 null/undefined
}
```

**交互说明**：
- 每个分组支持"全选/取消"快捷操作；
- 已绑定的接口预先勾选；
- 保存时将所有勾选的 `id` 数组一次提交，后端全量替换；
- 保存成功后后端自动失效受影响用户缓存，前端显示成功提示。

---

## 四、接口清单

| # | 方法 | 路径 | 功能 | 使用时机 |
|---|---|---|---|---|
| 1 | GET | `/api/Menu/tree/{platformType}` | 菜单树形数据 | 页面初始化、切换平台 Tab、操作后刷新 |
| 2 | GET | `/api/Menu/{id}` | 菜单节点详情 | 打开编辑 Drawer |
| 3 | GET | `/api/Menu/selector` | 菜单选择器（非 Operation 节点） | 新增/编辑 Drawer 的"上级菜单"字段 |
| 4 | POST | `/api/Menu` | 新增菜单节点 | 新增 Drawer 提交 |
| 5 | PUT | `/api/Menu/{id}` | 编辑菜单节点 | 编辑 Drawer 提交 |
| 6 | DELETE | `/api/Menu/{id}` | 删除菜单节点 | 删除确认后 |
| 7 | GET | `/api/Menu/{id}/Resources` | 获取 API 资源列表（含绑定状态） | 打开 API 绑定 Drawer |
| 8 | PUT | `/api/Menu/{id}/bind` | 保存 API 资源绑定 | 绑定 Drawer 保存 |

---

## 五、数据模型

### 5.1 展示数据（MenuDto / MenuTreeDto）

```typescript
interface MenuDto {
  id: number;
  name: string;
  code: string;
  parentId: number;
  type: MenuType;           // 1=Subsystem 2=Directory 3=Menu 4=Operation
  icon: string;
  iconType: MenuIconType;   // 1=Icon 2=Picture
  activeIcon: string;
  activeIconType: MenuIconType;
  url: string;
  order: number;
  remark: string;
  isVisible: boolean;
  isExternalLink: boolean;
  isLeaf: boolean;
  platformType: PlatformType;
  updatedAt: string;
}

interface MenuTreeDto extends MenuDto {
  children: MenuTreeDto[];
}

enum MenuType {
  Subsystem = 1,
  Directory = 2,
  Menu      = 3,
  Operation = 4,
}

enum MenuIconType {
  Icon    = 1,
  Picture = 2,
}
```

### 5.2 创建/编辑请求体（CreateMenuDto）

```typescript
interface CreateMenuDto {
  name: string;              // 必填，最大 256 字符
  code: string;              // 必填，最大 256 字符
  parentId?: number;         // null 或 0 = 根节点
  type: MenuType;            // 必填
  platformType: PlatformType;// 必填
  icon?: string;
  iconType?: MenuIconType;   // 默认 Icon(1)
  activeIcon?: string;
  activeIconType?: MenuIconType;
  url?: string;              // type=Menu 时必填
  order?: number;            // 默认 0
  isVisible?: boolean;       // 默认 true
  isExternalLink?: boolean;  // 默认 false
  remark?: string;
}
```

---

## 六、Drawer 表单设计

### 6.1 字段动态显隐规则汇总

| 字段 | Subsystem(1) | Directory(2) | Menu(3) | Operation(4) |
|---|---|---|---|---|
| 上级菜单 | 隐藏 | 显示 | 显示 | 显示 |
| 路由 URL | 隐藏 | 隐藏 | **必填** | 隐藏 |
| 是否可见 | 显示 | 显示 | 显示 | **隐藏**（固定false） |
| 是否外链 | 隐藏 | 隐藏 | 显示 | 隐藏 |
| 图标 | 显示 | 显示 | 显示 | 隐藏 |

### 6.2 上级菜单选择限制

- 所选上级菜单的 `type` 必须比当前节点 `type` 低一级（即只能挂在合法父节点下）；
- 编辑时过滤掉自身及其所有后代节点，防止循环引用。

---

## 七、交互规范

### 7.1 loading 状态

| 操作 | loading 范围 |
|---|---|
| 页面初始化 / 切换平台 Tab | 整个树形表格区域 spin |
| 打开编辑 Drawer | Drawer 内 spin（等待详情接口） |
| 打开绑定接口 Drawer | Drawer 内列表区域 spin |
| 提交编辑 / 保存绑定 | 对应 Drawer 提交按钮 loading |
| 删除 | 对应行删除按钮 loading |

### 7.2 消息反馈

| 操作 | 成功提示 | 失败提示 |
|---|---|---|
| 新增菜单 | `message.success('菜单添加成功')` | Drawer 内 Alert |
| 编辑菜单 | `message.success('保存成功')` | Drawer 内 Alert |
| 删除菜单 | `message.success('删除成功')` | `message.error(服务端原因)` |
| 保存 API 绑定 | `message.success('接口绑定已保存')` | `message.error(...)` |

---

## 八、字段校验规范

| 字段 | 规则 | 错误提示 |
|---|---|---|
| 菜单名称 | 必填，最大 256 字符 | "菜单名称不能为空" / "最多 256 个字符" |
| 菜单 Code | 必填，最大 256 字符 | "菜单代码不能为空" |
| 所属平台 | 必选 | "请选择所属平台" |
| 菜单类型 | 必选 | "请选择菜单类型" |
| 路由 URL | type=Menu 时必填 | "菜单类型为「菜单」时，路由地址不能为空" |

---

## 九、前端文件规划

```
src/pages/system/menu/
├── index.tsx             # 页面主文件（树形表格 + 平台 Tab）
├── MenuDrawer.tsx        # 新增/编辑 Drawer
├── ResourceDrawer.tsx    # API 资源绑定 Drawer
└── useMenu.ts            # 数据逻辑 Hook

src/services/menu.ts      # Menu 相关 API 封装
```

### 9.1 services/menu.ts 接口封装

> GET 参数必须用 `buildUrl` 拼入 URL，详见 [UI-Standards.md §2](./UI-Standards.md)

```typescript
// src/services/menu.ts
import { http, buildUrl } from '@/utils/request'

export const MenuApi = {
  getTree: (platformType: number, params?: { parentId?: number; includeChilds?: boolean }) =>
    http.get<MenuTreeDto[]>(buildUrl(`/Menu/tree/${platformType}`, params)),

  getById: (id: number) =>
    http.get<MenuDto>(`/Menu/${id}`),

  getSelector: () =>
    http.get<SelectOptionDto[]>('/Menu/selector'),

  create: (data: CreateMenuDto) =>
    http.post<number>('/Menu', data),

  update: (id: number, data: CreateMenuDto) =>
    http.put<void>(`/Menu/${id}`, data),

  remove: (id: number) =>
    http.delete<void>(`/Menu/${id}`),

  getResources: (id: number) =>
    http.get<MenuResourceDto[]>(`/Menu/${id}/Resources`),

  bindResources: (id: number, resourceIds: number[]) =>
    http.put<void>(`/Menu/${id}/bind`, resourceIds),
}
```

---

## 十、边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 删除有子节点的菜单 | 按钮 disabled，Tooltip 提示"请先删除子级菜单"；后端也有保护 |
| 上级菜单选择自身或子孙节点 | 前端选择器过滤；后端无此校验，依赖前端保障 |
| Operation 节点挂在非 Menu 节点下 | 前端表单限制上级只能选 Menu(3) 节点 |
| API 绑定 Drawer 无 API 数据 | 显示提示"暂无 API 资源，请先运行后端服务以自动注册" |
| 菜单变更后缓存失效延迟 | 后端同步清除 Redis 缓存，一般无延迟；前端无需特殊处理 |

---

## 十一、关联模块

| 模块 | 关联关系 |
|---|---|
| 角色管理（Role） | 角色权限配置以菜单树为配置基础（菜单管理决定可配置的菜单集合） |
| API 资源（ApiResource） | 通过 `InitApiResourceService` 在后端启动时自动注册；菜单绑定接口时使用 |
| 权限缓存（Redis） | 菜单属性或 API 绑定变更后，触发受影响用户的权限缓存失效 |

---

*文档维护：请在功能完成后将状态修改为"已完成"并更新 `最后更新` 日期。*

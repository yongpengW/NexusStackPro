# PRD：用户管理页面（User Management）

> 文档版本：V1.0  
> 创建日期：2026-03-02  
> 所属模块：系统管理 → 用户管理  
> 对应后端控制器：`UserController`  
> UI 规范：参见 [UI-Standards.md](./UI-Standards.md)  
> 文档状态：**已完成**  
> 最后更新：2026-03-02

---

## 一、页面概述

### 1.1 业务背景

用户管理是 RBAC 系统的核心入口。每个用户可绑定一个或多个**角色**（决定功能权限）和一个或多个**组织单元**（即 Region，决定数据范围）。用户在系统中的实际权限 = 所有角色权限的**并集**，数据可见范围由最宽松的 Region 绑定决定。

**默认密码规则**：新建用户的初始密码为其手机号后 6 位，管理员可随时触发"重置密码"还原至此规则。

### 1.2 页面目标

- 提供用户的增删改查、启用/禁用、重置密码功能；
- 支持按账号/手机/邮箱/角色/状态等多维度筛选（后端 `UserQueryDto` 支持字段：`userName / mobile / email / roleId / isEnable`）；
- 在列表中直观展示用户已绑定的角色标签；
- 在新增/编辑时可同时完成角色绑定和组织单元绑定（一次提交，事务原子性由后端保证）。

### 1.3 适用用户

| 角色 | 操作权限 |
|---|---|
| 超级管理员 | 全部操作 |
| 系统管理员 | 查看、新增、编辑、启禁用（不可删除自身、不可删除系统账号） |

---

## 二、页面布局

### 2.1 整体结构

```
┌──────────────────────────────────────────────────────────────────────┐
│  搜索栏：[账号] [手机号] [邮箱] [角色▼] [状态▼]  [搜索] [重置]       │
├──────────────────────────────────────────────────────────────────────┤
│  [+ 新增用户]                                        共 N 条记录      │
├──────────────────────────────────────────────────────────────────────┤
│  头像  账号     姓名   手机号      角色标签              状态  操作   │
│  [O]  admin   管理员  138xxxx  [超级管理员][PC端用户]   启用   编辑 更多▼  │
│  [O]  user01  张三    139xxxx  [运营专员]              启用   编辑 更多▼  │
│  ...                                                                   │
├──────────────────────────────────────────────────────────────────────┤
│                            分页：< 1 2 3 ... >                        │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 布局说明

- 采用 `ProTable` 实现分页表格（遵循 UI 规范，ProComponents 优先）；
- 角色标签用 `Tag` 组件展示，不同平台用不同颜色区分（见第 3.1 节）；
- 操作列"更多"下拉收纳：禁用/启用、重置密码、删除；
- 列表按用户 ID 降序排列（最新注册的在前）。

---

## 三、功能需求

### 3.1 用户列表展示

**接口**：`GET /api/User/list`

**查询参数**：

| 参数 | 类型 | 说明 |
|---|---|---|
| `userName` | string | 账号模糊匹配 |
| `mobile` | string | 手机号模糊匹配 |
| `email` | string | 邮箱模糊匹配 |
| `roleId` | long | 按角色筛选（可选） |
| `isEnable` | bool? | 状态筛选（可选） |
| `page` / `limit` | int | 分页参数 |

**展示字段**：

| 列名 | 字段 | 说明 |
|---|---|---|
| 头像 | `avatar` | `Avatar` 组件，无头像时显示首字母 |
| 账号 | `userName` | - |
| 姓名 | `realName` | - |
| 手机号 | `mobile` | - |
| 角色 | `userRoles` | 角色 Tag 列表，颜色按平台区分 |
| 最后登录 | `lastLoginTime` | 本地时间格式化（UTC→本地） |
| 状态 | `isEnable` | 绿色"启用" / 灰色"禁用" |
| 操作 | - | 见第 3.5 节 |

**角色 Tag 颜色方案**（按 `platforms` 位掩码）：

| 平台 | 值 | Tag 颜色 |
|---|---|---|
| Admin（超管） | 1 | `red` |
| Pc（PC端） | 2 | `blue` |
| Mini（小程序） | 4 | `green` |
| Android（App） | 8 | `orange` |
| 多平台 | 组合值 | 多色叠加（每个平台单独一个 Tag） |

### 3.2 搜索筛选

- 搜索栏支持多条件联合过滤，条件之间为 **AND** 关系；
- 角色筛选下拉数据来自 `GET /api/Role/selector`；
- 状态筛选下拉：全部 / 启用 / 禁用；
- 搜索与重置按钮同行，表单字段变化不自动触发搜索（需点击按钮）。

### 3.3 新增用户

**接口**：`POST /api/User`  
**触发入口**：顶部"新增用户"按钮  
**交互形式**：右侧 Drawer（宽度 560px）

**表单字段**：

| 字段 | 组件 | 必填 | 校验规则 |
|---|---|---|---|
| 账号（UserName） | Input | ✅ | 不能为空，最大 64 字符 |
| 真实姓名 | Input | ❌ | 最大 64 字符 |
| 昵称 | Input | ❌ | - |
| 手机号 | Input | ✅ | 不能为空，11 位数字格式 |
| 邮箱 | Input | ❌ | Email 格式校验 |
| 性别 | Radio | ❌ | 未知(0) / 男(1) / 女(2) |
| 角色 | Select（多选） | ✅ | 至少选择 1 个角色；数据来自 `GET /api/Role/selector` |
| 所属组织 | Select（多选） | ❌ | 数据来自 `GET /api/Region/selector`（isIncludeZero=false） |
| 是否启用 | Switch | ✅ | 默认开启 |
| 备注 | TextArea | ❌ | 最大 512 字符 |

**提交逻辑**：
1. 校验通过后调用 `POST /api/User`；
2. 后端在同一事务内完成：创建用户 → 绑定角色 → 绑定组织单元；
3. 初始密码为手机号后 6 位（后端设置，前端不展示）；
4. 成功后关闭 Drawer，刷新列表，显示 `message.success('用户创建成功，初始密码为手机号后6位')`。

### 3.4 编辑用户

**接口**：`GET /api/User/{id}`（回显）、`PUT /api/User/{id}`（保存）  
**触发入口**：操作列"编辑"按钮  
**交互形式**：右侧 Drawer（560px），与新增共用

**特殊说明**：
- 编辑时不修改密码（密码修改走"重置密码"流程）；
- 角色与组织单元采用**全量替换**方式（后端删除旧关联 → 写入新关联），前端直接展示当前绑定的所有角色和组织；
- 打开 Drawer 时重新请求 `GET /api/User/{id}` 获取最新数据，不使用列表行缓存。

### 3.5 操作按钮

| 操作 | 显示条件 | 说明 |
|---|---|---|
| **编辑** | 始终显示 | 打开编辑 Drawer |
| **启用** | `isEnable = false` | 直接调用启用接口，无需确认 |
| **禁用** | `isEnable = true` 且非当前登录用户 | 弹出 Popconfirm 确认 |
| **重置密码** | 始终显示 | 弹出 Popconfirm 确认后调用 `PUT /api/User/reset/{id}` |
| **删除** | 非当前登录用户 | 弹出 Popconfirm 二次确认 |

> **当前登录用户限制**：禁用/删除操作对当前登录用户置灰，Tooltip 提示"无法操作当前登录用户"。服务端亦有兜底校验。

### 3.6 启用 / 禁用用户

**接口**：`PUT /api/User/enable/{id}` / `PUT /api/User/disable/{id}`

**交互说明**：
- 禁用确认文案："禁用后该用户将无法登录系统，确认禁用？"；
- 操作成功后立即刷新当前行状态（无需整页刷新）；
- 禁用/启用同时会触发后端**权限缓存失效**，对用户实时生效。

### 3.7 重置密码

**接口**：`PUT /api/User/reset/{id}`

**交互说明**：
- 确认文案："重置后密码将恢复为手机号后6位，确认重置？"；
- 成功提示：`message.success('密码已重置为手机号后6位')`。

### 3.8 删除用户

**接口**：`DELETE /api/User/{id}`

**后端行为**（事务原子）：
1. 删除用户-角色关联（`UserRole` 表）；
2. 删除用户-组织单元关联（`UserDepartment` 表）；
3. 软删除用户主记录；
4. 清除该用户所有平台的权限缓存。

**交互说明**：
- 确认文案："删除后数据不可恢复，确认删除该用户？"；
- 删除成功后从列表移除该行，若当前页无数据则跳回上一页。

---

## 四、接口清单

| # | 方法 | 路径 | 功能 | 使用时机 |
|---|---|---|---|---|
| 1 | GET | `/api/User/list` | 用户分页列表 | 页面初始化、搜索、翻页 |
| 2 | GET | `/api/User/{id}` | 用户详情（含角色/组织） | 打开编辑 Drawer |
| 3 | GET | `/api/User/me` | 当前登录用户信息 | 用于标记"当前用户"，禁止自操作 |
| 4 | POST | `/api/User` | 新增用户 | 新增 Drawer 提交 |
| 5 | PUT | `/api/User/{id}` | 编辑用户 | 编辑 Drawer 提交 |
| 6 | PUT | `/api/User/enable/{id}` | 启用用户 | 点击"启用"操作 |
| 7 | PUT | `/api/User/disable/{id}` | 禁用用户 | 点击"禁用"确认后 |
| 8 | PUT | `/api/User/reset/{id}` | 重置密码 | 点击"重置密码"确认后 |
| 9 | DELETE | `/api/User/{id}` | 删除用户 | 点击"删除"确认后 |
| 10 | GET | `/api/Role/selector` | 角色选择器数据 | Drawer 中角色字段初始化 |
| 11 | GET | `/api/Region/selector` | 组织单元选择器数据 | Drawer 中所属组织字段初始化 |

---

## 五、数据模型

### 5.1 展示数据（UserDto）

```typescript
interface UserDto {
  id: number;
  userName: string;
  realName: string;
  nickName: string;
  mobile: string;
  email: string;
  gender: Gender;        // 0=未知 1=男 2=女
  avatar: string;
  isEnable: boolean;
  hasPassword: boolean;
  lastLoginTime: string; // UTC 时间字符串，展示时转本地
  userRoles: UserRoleDto[];
  departments: UserDepartmentDto[];
}

interface UserRoleDto {
  id: number;
  roleId: number;
  roleName: string;
  platforms: PlatformType;  // Flags枚举位掩码
}

interface UserDepartmentDto {
  userId: number;
  departmentId: number;  // 实际指向 Region.Id
}
```

### 5.2 创建 / 编辑请求体（CreateUserDto）

```typescript
interface CreateUserDto {
  userName: string;         // 必填
  realName?: string;
  nickName?: string;
  mobile: string;           // 必填
  email?: string;
  gender?: Gender;
  isEnable: boolean;        // 默认 true
  remark?: string;
  userRoles: { roleId: number }[];  // 必填，至少1个
  departmentIds: number[];          // Region.Id 数组，可为空
}
```

---

## 六、Drawer 表单设计

### 6.1 新增/编辑 Drawer 布局

```
┌───────────────────── 新增用户 / 编辑用户 ─────── [×] ┐
│                                                       │
│  账号 *      [_________________________]              │
│  真实姓名    [_________________________]              │
│  昵称        [_________________________]              │
│  手机号 *    [_________________________]              │
│  邮箱        [_________________________]              │
│  性别        (○)未知  (○)男  (○)女                   │
│  角色 *      [请选择（多选）___________▼]             │
│              ┌──────────────────────────┐             │
│              │ □ 超级管理员             │             │
│              │ ☑ PC端运营专员          │             │
│              │ □ 移动端用户             │             │
│              └──────────────────────────┘             │
│  所属组织    [请选择（多选）___________▼]             │
│  是否启用    [●────] 启用                             │
│  备注        [                         ]              │
│                                                       │
│                         [取消]  [确认提交]            │
└───────────────────────────────────────────────────────┘
```

### 6.2 Drawer 初始化逻辑

| 时机 | 行为 |
|---|---|
| 新增 | 所有字段清空，`isEnable` 默认 `true` |
| 编辑 | 调用 `GET /api/User/{id}` 获取完整数据后回填，角色和组织选中当前已绑定项 |
| Drawer 关闭 | 清空表单状态，避免再次打开时残留旧数据 |

---

## 七、交互规范

### 7.1 loading 状态

| 操作 | loading 范围 |
|---|---|
| 页面初始化 / 搜索 | 整个表格区域 spin |
| 打开编辑 Drawer | Drawer 内骨架屏（等待详情接口） |
| 提交新增/编辑 | "确认提交"按钮 loading |
| 启禁用 / 删除 / 重置密码 | 对应行操作按钮 loading |

### 7.2 消息反馈

| 操作 | 成功提示 | 失败提示 |
|---|---|---|
| 新增 | `message.success('用户创建成功，初始密码为手机号后6位')` | Drawer 内 Alert |
| 编辑 | `message.success('保存成功')` | Drawer 内 Alert |
| 启用 | `message.success('已启用')` | `message.error(...)` |
| 禁用 | `message.success('已禁用')` | `message.error(...)` |
| 重置密码 | `message.success('密码已重置为手机号后6位')` | `message.error(...)` |
| 删除 | `message.success('删除成功')` | `message.error(...)` |

---

## 八、字段校验规范

| 字段 | 规则 | 错误提示 |
|---|---|---|
| 账号 | 必填，最大 64 字符 | "账号不能为空" / "最多 64 个字符" |
| 手机号 | 必填，11 位数字 | "手机号不能为空" / "手机号格式不正确" |
| 邮箱 | 可空，Email 格式 | "邮箱格式不正确" |
| 角色 | 必选，至少 1 个 | "请为用户选择角色" |

---

## 九、前端文件规划

```
src/pages/system/user/
├── index.tsx           # 页面主文件（分页表格 + 搜索栏）
├── UserDrawer.tsx      # 新增/编辑 Drawer（共用，title 动态切换）
└── useUser.ts          # 数据逻辑 Hook

src/services/user.ts    # User 相关 API 封装
```

### 9.1 services/user.ts 接口封装

> GET 参数必须用 `buildUrl` 拼入 URL，详见 [UI-Standards.md §2](./UI-Standards.md)

```typescript
// src/services/user.ts
import { http, buildUrl } from '@/utils/request'

export const UserApi = {
  getList: (params: {
    page?: number; limit?: number
    userName?: string; mobile?: string; email?: string
    roleId?: number; isEnable?: boolean
  }) =>
    http.get<IPagedList<UserDto>>(buildUrl('/User/list', params)),

  getById:       (id: number) =>
    http.get<UserDto>(`/User/${id}`),

  getMe:         () =>
    http.get<CurrentUserDto>('/User/me'),

  create:        (data: CreateUserDto) =>
    http.post<number>('/User', data),

  update:        (id: number, data: CreateUserDto) =>
    http.put<void>(`/User/${id}`, data),

  remove:        (id: number) =>
    http.delete<void>(`/User/${id}`),

  enable:        (id: number) =>
    http.put<void>(`/User/enable/${id}`, {}),

  disable:       (id: number) =>
    http.put<void>(`/User/disable/${id}`, {}),

  resetPassword: (id: number) =>
    http.put<void>(`/User/reset/${id}`, {}),
}
```

---

## 十、边界条件与异常处理

| 场景 | 处理方式 |
|---|---|
| 禁用/删除当前登录用户 | 按钮 disabled，Tooltip 提示"无法操作当前登录用户"；服务端亦拦截 |
| 新增时未选择角色 | 表单校验拦截，提示"请为用户选择角色" |
| 删除有关联角色/组织的用户 | 后端事务原子处理，前端仅展示服务端错误信息 |
| 列表空状态 | 显示空状态组件，引导"点击新增用户" |
| 网络错误 | 显示重试按钮 |

---

## 十一、关联模块

| 模块 | 关联关系 |
|---|---|
| 区域管理（Region） | 所属组织选择器数据来源 |
| 角色管理（Role） | 角色选择器数据来源 |
| 菜单权限（Menu） | 用户通过角色间接获得菜单权限 |
| 操作日志（OperationLog） | 管理员对用户的操作自动记录日志 |

---

*文档维护：后续有变更时请更新 `最后更新` 日期。*

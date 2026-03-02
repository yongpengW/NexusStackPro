# NexusStackPro

<div align="center">

🖥️ **一个开箱即用的现代化中台前端管理系统模板**

与 [NexusStack](https://github.com/yongpengW/NexusStack) .NET 10 微服务后台配套使用

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.29-0170FE?logo=antdesign)](https://ant.design/)
[![许可证](https://img.shields.io/badge/许可证-MIT-green.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/yongpengW/NexusStackPro?style=social&label=NexusStackPro%20Stars)](https://github.com/yongpengW/NexusStackPro)

</div>

---

## ✨ 特性

> NexusStackPro 是 NexusStack 全栈解决方案的前端部分。NexusStack 是一套生产级 .NET 10 微服务后台框架，集成了 API 网关、SignalR 实时通信、RabbitMQ 消息队列、Redis 缓存、EF Core 多数据库、AgileConfig 分布式配置、Serilog 结构化日志等企业级基础设施。NexusStackPro 与之对应，提供同样开箱即用的前端中台基座。
> Antd官方有一套Antd Pro的企业中台模板，但是官方的是基于UmiJS，整体使用太厚重了，也不利于中小型团队快速上手开发，所以我自己使用Antd和pro-components搭建了套，去掉了臃肿的UmiJS，实现了官方级别的中台系统框架

- 🏗️ **完整的工程化基础设施** — 多环境构建、路径别名、ESLint、TypeScript 严格模式
- 🔐 **认证与路由鉴权** — 登录状态持久化，`<AuthGuard>` 守卫路由，`useAccess` 权限控制
- 🌐 **国际化** — zh-CN / en-US 双语，语言自动检测，antd locale 动态联动
- 📡 **请求层统一封装** — 解包后端 `RequestResultModel`，全局处理 401 / 403 / 500 / 网络错误
- 🗄️ **服务端状态管理** — React Query，与 Zustand 客户端状态严格分离
- 🎨 **Pro 风格布局** — ProLayout mix 模式，菜单路由、Header 操作区、Avatar 下拉、Footer
- 📦 **丰富的页面模板** — 仪表盘、表单、列表、详情、结果、异常、账户设置、系统管理（区域/角色/菜单/用户/权限）等开箱即用
- 🕐 **日期时间规范** — UTC ↔ 本地时区自动转换，dayjs 全插件集成

> 框架设计、目录结构、路由规划、已完成功能及待办事项请参阅 [NexusStackPro-Design.md](./NexusStackPro-Design.md)。各业务模块 PRD（区域/角色/菜单/用户/权限管理等）见 [Docs/PRD](./Docs/PRD)。

---

## 技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| React | 19.0.0 | 配合 `@ant-design/v5-patch-for-react-19` 兼容补丁 |
| TypeScript | 5.9.x | 严格模式 |
| Vite | 7.x | 构建工具，开发端口 5173 |
| Ant Design | 5.29.3 | UI 组件库 |
| @ant-design/pro-components | 2.8.10 | ProLayout / ProTable / ProForm 等高级组件 |
| react-router-dom | 7.x | `createBrowserRouter`，嵌套路由 |
| Zustand | 5.x | 客户端全局状态管理 |
| @tanstack/react-query | 5.x | 服务端状态管理（数据查询 / Mutation） |
| i18next + react-i18next | 25.x / 16.x | 国际化框架 |
| i18next-browser-languagedetector | 8.x | 浏览器语言自动检测 |
| dayjs | 1.11.x | 日期处理（含 utc / timezone / relativeTime 插件） |

**路径别名：** `@/` → `src/`（`vite.config.ts` + `tsconfig.app.json` 均已配置）

---

## 启动方式

```bash
cd NexusStackPro
npm install

# 本地开发（.env）
npm run dev

# 局域网测试环境预览（.env.test）
npm run dev:test

# 生产构建（.env.production）→ 输出 dist/
npm run build

# 局域网测试环境构建 → 输出 dist-test/
npm run build:test

# 预演示环境构建 → 输出 dist-staging/
npm run build:staging

# 正式环境构建 → 输出 dist/
npm run build:prod

# 本地预览构建产物
npm run preview
npm run preview:test
npm run preview:staging
```

---

## 多环境配置

| 文件 | 对应 mode | 用途 | 命令示例 |
|---|---|---|---|
| `.env` | — | 基础默认值，所有环境共用 | `npm run dev` |
| `.env.test` | `test` | 局域网测试环境 | `npm run dev:test` / `build:test` |
| `.env.staging` | `staging` | 预演示环境 | `npm run build:staging` |
| `.env.production` | `production` | 正式生产环境 | `npm run build:prod` |

**加载规则**：Vite 每次先加载 `.env`（基础值），再用 `.env.[mode]` 中的同名变量覆盖。

**变量规范**：
- `VITE_` 前缀 → 暴露给客户端，通过 `import.meta.env.VITE_XXX` 访问，类型已在 `vite-env.d.ts` 声明
- 无 `VITE_` 前缀（如 `API_TARGET`）→ 仅 `vite.config.ts` 内通过 `loadEnv` 读取，不暴露给客户端

**Proxy 机制**：dev server 在有 `API_TARGET` 时自动将 `/api/*` 请求转发到目标服务器，构建产物中 `VITE_API_BASE_URL` 直接指向远端地址（不经过 proxy）。

**构建输出目录**：
- `production` → `dist/`
- 其他 mode → `dist-{mode}/`（如 `dist-test/`、`dist-staging/`）

**本地私密覆盖**：如需在本机覆盖 `API_TARGET` 等敏感值而不提交 git，可创建 `.env.local`（或 `.env.test.local`），Vite 优先加载 `.local` 文件，已在 `.gitignore` 中排除。

---

## 布局说明（MainLayout）

| 配置项 | 值 | 说明 |
|---|---|---|
| `layout` | `"mix"` | 顶部 + 侧边混合导航 |
| `fixedHeader` | `true` | 固定顶栏 |
| `fixSiderbar` | `true` | 固定侧栏 |
| `bgLayoutImgList` | 3 张菱形背景图 | 来自 mdn.alipayobjects.com CDN |
| `actionsRender` | Question / SelectLang / Bell / Setting | 顶栏右侧操作区 |
| `avatarProps` | AvatarDropdown + AvatarName | 头像区域 |
| `footerRender` | Footer 组件 | 底部版权信息 |

---

## 全局状态（Zustand）

```ts
// useAppStore（src/store/useAppStore.ts）
{
  userInfo: { userId, userName, email, avatar? } | null,
  token: string | null,
  refreshToken: string | null,
  loading: boolean,
  setLoginData: (result: LoginResult) => void,  // 登录成功后写入状态 + localStorage
  logout: () => void,                            // 清空状态 + localStorage
  setLoading: (loading: boolean) => void,
}
```

`userInfo` / `token` / `refreshToken` 均持久化到 `localStorage`，刷新页面自动恢复登录态。当 `userInfo` 为 `null` 时，`AvatarDropdown` 显示"未登录"按钮，点击跳转 `/user/login`。

---

## HTTP 请求层（`src/utils/request.ts`）

后端统一响应格式 `RequestResultModel<T>`：

```json
{ "success": true, "code": 200, "message": "ok", "data": {}, "timestamp": 1234567890 }
```

全局错误处理规则（调用方无需重复处理）：

| code | 处理方式 |
|------|----------|
| `200` + `success=true` | 直接返回 `data`，上层完全透明 |
| `0`（网络中断）| 全局 `notification.error` 提示 |
| `401` | 清除 localStorage，`message.warning` 提示，800ms 后跳 `/user/login`（在登录页时跳过）|
| `403` | 全局 `notification.error` 提示，抛出 `ApiError(403)` |
| `500` | 全局 `notification.error` 提示，抛出 `ApiError(500)` |
| 其他非 200 | 抛出 `ApiError(code, message)`，由调用方决定 |

> `ApiError` 的错误码字段为 `code`（非 `status`），调用方 catch 时用 `err.code` 判断。

`globalApp.ts` 通过 Proxy 模式将 `App.useApp()` 实例暴露给非组件代码，`main.tsx` 中的 `GlobalAppSetup` 组件负责注册。

---

## React Query 使用规范

**原则：将服务端状态与客户端状态分离**
- **Zustand**：客户端全局状态（当前登录用户、主题、语言等，长期存在）
- **React Query**：服务端状态（列表数据、详情、统计等，由服务端驱动）

### 数据查询（useQuery）

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['userList', { page, pageSize }],  // key 包含依赖参数，变更时自动重新请求
  queryFn: () => getUserList({ page, pageSize }),
})
```

### 数据变更（useMutation）

```ts
const { mutate, isPending } = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['userList'] })  // 自动刷新列表
    message.success('创建成功')
  },
  onError: (err) => {
    // 只处理需要行内反馈的业务错误，其他已由 request.ts 全局处理
  },
})
```

### QueryClient 全局默认配置（`main.tsx`）

| 配置项 | 值 | 说明 |
|------|------|------|
| `refetchOnWindowFocus` | `false` | 窗口聚焦不自动重新请求（管理后台） |
| `retry` (queries) | `1` | 失败重试 1 次 |
| `staleTime` | `5min` | 5 分钟内数据视为新鲜 |
| `retry` (mutations) | `0` | mutation 失败不重试 |

开发环境（`import.meta.env.DEV`）自动挂载 `ReactQueryDevtools`，可在浏览器右下角查看所有 query 的缓存状态。

---

## 国际化（i18n）

- 支持语言：**简体中文（zh-CN）**、**English（en-US）**
- 语言持久化：`localStorage` key 为 `i18n_lang`（定义在 `src/locales/i18n.ts`）
- 切换方式：Header 右侧 `SelectLang` 下拉菜单
- antd 组件 locale 动态跟随 i18n 语言（在 `main.tsx` 的 `Root` 组件中实现）
- 翻译 key 命名规范：`menu.*` / `pages.login.*` / `pages.home.*` / `pages.admin.*` / `pages.ruleList.*` / `pages.analysis.*` / `pages.account.settings.*` / `pages.404.*` / `component.avatar.*` / `common.*`

---

## 日期时间规范（`src/utils/dateUtils.ts`）

后端存储与传输统一使用 **UTC ISO 8601**（带 `Z` 后缀），前端展示自动转为用户本地时区，提交时转回 UTC。

```ts
import { formatDateTime, formatDate, fromNow, toUtcISOString } from '@/utils/dateUtils'

formatDateTime('2026-02-28T06:24:13.000Z')  // "2026-02-28 14:24:13"（东八区）
formatDate('2026-02-28T06:24:13.000Z')       // "2026-02-28"
fromNow('2026-02-28T06:24:13.000Z')          // "3 小时前"
toUtcISOString(dayjsValue)                   // "2026-02-28T06:24:13.000Z"
```

---

*最后更新：2026-03-02*

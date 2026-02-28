# NexusStackPro 前端框架设计文档

> 本文档记录 NexusStackPro 前端项目的整体架构设计、目录结构、路由规划、已完成功能清单及待办事项。

---

## 项目概述

NexusStackPro 是 **NexusStack** 全栈解决方案的前端部分。NexusStack 是一套生产级 .NET 10 微服务后台框架（API 网关 / SignalR / RabbitMQ / Redis / EF Core / AgileConfig / Serilog / Docker），NexusStackPro 与之配套，提供一套开箱即用的现代化中台前端管理系统模板。

前端基于 **Vite + React 19 + Ant Design Pro** 风格构建，采用组件化、模块化架构，支持国际化、多环境部署、路由鉴权、服务端状态管理等企业级特性，可作为接入 NexusStack 后台或其他 RESTful 服务的前端基座直接使用。

---

## 项目文件结构（src/）

```
src/
├── main.tsx                    # 应用入口，Root 组件含动态 antd locale
├── index.css                   # 全局样式
├── vite-env.d.ts               # Vite 环境变量类型声明
│
├── layouts/
│   └── MainLayout.tsx          # 主布局：ProLayout mix 模式
│
├── config/
│   └── routes.tsx              # useMenuRoutes() Hook，ProLayout 菜单路由配置
│
├── pages/
│   ├── home/index.tsx          # 首页
│   ├── welcome/index.tsx       # 欢迎页
│   ├── admin/index.tsx         # 管理页（仅管理员可见）
│   ├── login/
│   │   ├── index.tsx           # 登录页（仿 Pro 官方）
│   │   └── index.css
│   ├── not-found/index.tsx     # 404 页
│   ├── dashboard/
│   │   ├── analysis/index.tsx  # 仪表盘 - 分析页
│   │   ├── monitor/index.tsx   # 仪表盘 - 监控页
│   │   └── workplace/index.tsx # 仪表盘 - 工作台
│   ├── form/
│   │   ├── basic-form/index.tsx    # 基础表单
│   │   ├── step-form/index.tsx     # 分步表单
│   │   └── advanced-form/index.tsx # 高级表单
│   ├── list/
│   │   ├── rule-list/index.tsx  # 规则列表（ProTable + 搜索 + 批量删除 + Drawer）
│   │   ├── table-list/index.tsx # 查询表格
│   │   ├── basic-list/index.tsx # 标准列表
│   │   ├── card-list/index.tsx  # 卡片列表
│   │   └── search/index.tsx     # 搜索列表
│   ├── profile/
│   │   ├── basic/index.tsx     # 基础详情页
│   │   └── advanced/index.tsx  # 高级详情页
│   ├── result/
│   │   ├── success/index.tsx   # 成功页
│   │   └── fail/index.tsx      # 失败页
│   ├── exception/
│   │   ├── 403/index.tsx       # 403 无权限页
│   │   ├── 404/index.tsx       # 404 页
│   │   └── 500/index.tsx       # 500 服务异常页
│   ├── analysis/index.tsx      # 数据分析（旧路径保留兼容）
│   └── account/
│       ├── center/index.tsx    # 个人中心
│       └── settings/index.tsx  # 账户设置（4 Tab：基本/安全/通知/绑定）
│
├── router/
│   └── index.tsx               # 路由配置（嵌套结构）
│
├── store/
│   └── useAppStore.ts          # Zustand store（userInfo / token / refreshToken，含 localStorage 持久化）
│
├── services/
│   └── auth.ts                 # 认证相关 API（loginByPassword）
│
├── utils/
│   ├── request.ts              # 基础 HTTP 工具（fetch 封装，统一解包 RequestResultModel，全局错误处理）
│   ├── globalApp.ts            # 组件外使用 antd message / notification 的代理工具
│   └── dateUtils.ts            # 日期时间工具（UTC → 本地时区展示，本地 → UTC 提交）
│
├── components/
│   ├── index.ts                # 统一出口
│   ├── Footer/index.tsx        # DefaultFooter
│   ├── HeaderDropdown/index.tsx
│   └── RightContent/
│       ├── index.tsx           # Question（帮助链接）+ SelectLang（语言切换）
│       └── AvatarDropdown.tsx  # 头像菜单（登出 / 设置 / 未登录跳转）
│
└── locales/
    ├── i18n.ts                 # i18next 初始化配置
    ├── zh-CN.ts                # 简体中文
    └── en-US.ts                # English
```

---

## 路由结构

```
/user/login                → 登录页（无 MainLayout）
/                          → MainLayout（壳子）redirect → /dashboard/analysis
├── /home                  → 首页
├── /welcome               → 欢迎页
├── /admin                 → 管理页
├── /analysis              → 数据分析（旧路径，保留兼容）
├── /dashboard             → redirect → /dashboard/analysis
│   ├── /dashboard/analysis   → 仪表盘分析页
│   ├── /dashboard/monitor    → 监控页
│   └── /dashboard/workplace  → 工作台
├── /form                  → redirect → /form/basic-form
│   ├── /form/basic-form      → 基础表单
│   ├── /form/step-form       → 分步表单
│   └── /form/advanced-form   → 高级表单
├── /list                  → redirect → /list/table-list
│   ├── /list/rule-list       → 规则列表
│   ├── /list/table-list      → 查询表格
│   ├── /list/basic-list      → 标准列表
│   ├── /list/card-list       → 卡片列表
│   └── /list/search          → 搜索列表
├── /profile               → redirect → /profile/basic
│   ├── /profile/basic        → 基础详情页
│   └── /profile/advanced     → 高级详情页
├── /result                → redirect → /result/success
│   ├── /result/success       → 成功页
│   └── /result/fail          → 失败页
├── /exception             → redirect → /exception/404
│   ├── /exception/403        → 403 无权限
│   ├── /exception/404        → 404 页
│   └── /exception/500        → 500 服务异常
└── /account               → redirect → /account/center
    ├── /account/center       → 个人中心
    └── /account/settings     → 账户设置
*                          → 404
```

> **重要：** ProLayout `layout="mix"` 模式下，父级菜单组节点若没有 `path` 属性，整个子树会被静默过滤不显示。所有父级组节点必须带 `path`。

---

## 已完成功能清单

- [x] 登录页（LoginForm + ProFormCaptcha + 错误提示 Alert）
- [x] 登录接口接入（`POST /Token/password`，platformType=2，全局错误处理）
- [x] 登录状态持久化（token / refreshToken / userInfo 存入 localStorage，刷新页面自动恢复）
- [x] HTTP 请求层封装（`src/utils/request.ts`，统一解包 `RequestResultModel`，全局处理 401/403/500/网络错误）
- [x] globalApp 工具（`src/utils/globalApp.ts`，组件外调用 antd message / notification）
- [x] 日期时间工具（`src/utils/dateUtils.ts`，UTC ↔ 本地时区，dayjs utc/timezone/relativeTime 插件）
- [x] React Query 接入（`@tanstack/react-query`，QueryClientProvider 挂载，登录页 useMutation 迁移，DevTools 仅开发环境）
- [x] MainLayout 主布局（mix 模式、菱形背景图）
- [x] 菜单路由配置抽离为 `useMenuRoutes()` Hook（`config/routes.tsx`）
- [x] 首页（欢迎卡片）
- [x] 欢迎页（`/welcome`）
- [x] 管理页（`/admin`，管理员专属提示）
- [x] 仪表盘（`/dashboard`）：分析页 / 监控页 / 工作台（三个子页面）
- [x] 表单页（`/form`）：基础表单 / 分步表单 / 高级表单（三个子页面）
- [x] 列表页（`/list`）：规则列表 / 查询表格 / 标准列表 / 卡片列表 / 搜索列表（五个子页面）
- [x] 详情页（`/profile`）：基础详情页 / 高级详情页
- [x] 结果页（`/result`）：成功页 / 失败页
- [x] 异常页（`/exception`）：403 / 404 / 500
- [x] 个人中心（`/account/center`）
- [x] 账户设置页（`/account/settings`，4 Tab ProForm）
- [x] 数据分析页（`/analysis`，StatisticCard 指标卡 + 进度条 + 访问日志表格，旧路径保留兼容）
- [x] Header 右侧组件（Question / SelectLang / 消息铃铛 / 设置跳转）
- [x] 头像下拉菜单（登出 / 前往设置 / 未登录提示）
- [x] 国际化（zh-CN + en-US，语言自动检测，antd locale 动态联动）
- [x] Footer 组件（DefaultFooter 版权信息 + 链接）

---

## 待完成 / 下一步工作

### 基础设施
- [ ] **路由鉴权守卫**：在 `router/index.tsx` 封装 `<AuthGuard>` 组件，未登录时访问受保护路由自动跳转 `/user/login`；已登录时访问 `/user/login` 自动重定向首页
- [ ] **权限控制（useAccess Hook）**：封装 `useAccess()` 根据 `userInfo` 返回权限对象（如 `{ isAdmin, canEdit }`），控制菜单、按钮、页面的可见性
- [x] **Token 自动刷新机制**：`request.ts` 收到 401 时，先用 `refreshToken` 调用 `/Token/refresh` 换取新 `accessToken`，成功后自动重试原请求并更新 store；若刷新也失败（refreshToken 过期）再执行登出跳转。需处理并发请求同时触发 401 时的队列等待，避免多次刷新

### 业务功能
- [ ] **消息通知**：Bell 图标当前 count 硬编码为 5，需接入真实通知数据
- [ ] **仪表盘各页内容完善**：monitor / workplace 当前为占位内容，待填充真实图表
- [ ] **表单页提交逻辑**：basic-form / step-form / advanced-form 提交接入后端
- [ ] **列表页完善**：table-list / basic-list / card-list / search-list 补充真实数据与交互
- [ ] **详情页内容**：profile/basic 与 profile/advanced 填充真实业务数据
- [ ] **个人设置保存**：ProForm 提交逻辑与后端打通
- [ ] **规则列表 CRUD**：新建 / 编辑 Modal 的表单提交接入后端

### 优化
- [ ] **路由懒加载**：引入 ECharts 等大体积图表库后，对相关重页面做 `React.lazy` + `Suspense` 拆包，其余页面保持静态 import

---

## 注意事项 & 已知坑

1. **ProLayout mix 模式父节点必须有 path**  
   父级菜单组（如 `/dashboard`、`/list`、`/account` 等）若不设置 `path` prop，ProLayout 会静默丢弃该节点及其所有子节点，菜单不显示且无任何报错。

2. **中文字符 replace_string_in_file 编码问题**  
   使用 VS Code AI 工具编辑含中文字符的文件时，`replace_string_in_file` 可能因编码匹配失败。此时使用 PowerShell `[System.IO.File]::WriteAllText(path, content, [System.Text.Encoding]::UTF8)` 全量重写文件可绕过此问题。

3. **React 19 + antd v5 兼容**  
   需在 `main.tsx` 最顶部导入 `@ant-design/v5-patch-for-react-19`，否则部分组件会有控制台警告。

4. **语言切换持久化 key**  
   localStorage 中 key 为 `i18n_lang`（定义在 `src/locales/i18n.ts` 的 `detection.lookupLocalStorage`）。

5. **登录路径为 `/user/login`**  
   登录页挂载在 `/user/login`（router 中 `path: '/user'` 下的子路由）。`AvatarDropdown` 及 `request.ts` 401 全局跳转均指向 `/user/login`。

6. **`.env.local` 本地私密覆盖**  
   如需在本机覆盖 `API_TARGET` 等敏感值而不提交 git，可创建 `.env.local`（或 `.env.test.local` 等），Vite 会优先加载 `.local` 文件，已在 `.gitignore` 中排除。

7. **proxy rewrite 与后端路径前缀**  
   当前后端路由本身带 `/api` 前缀，proxy **不做路径重写**（`rewrite` 已移除）。同时设置了 `secure: false` 以允许代理到自签名 HTTPS 的本地开发服务器（`https://localhost:7005`）。若后端不带 `/api` 前缀，需在 `vite.config.ts` 中加回 `rewrite: (p) => p.replace(/^\/api/, '')`。

8. **`ApiError` 的错误码字段为 `code`，不是 `status`**  
   `request.ts` 中 `ApiError` 的属性名为 `code`（对应后端 `RequestResultModel.Code`），调用方 catch 时用 `err.code` 判断。

---

## Excel 处理工具类实现与最佳实践

> 2026-03-01 已全量迁移为 exceljs，支持本地/UTC时间自动转换、富文本/公式单元格、类型安全校验，详见 src/utils/excel.tsx。

### 设计原则
- 采用 [exceljs](https://github.com/exceljs/exceljs) 作为唯一依赖，彻底移除 xlsx/xlsx-js-style（社区 fork）
- 读写均为异步，支持大文件、原生样式、日期自动识别
- 导入/导出均支持本地时间与 UTC 自动转换，避免时区错乱
- 校验逻辑内聚，错误高亮直接返回 JSX，方便 antd Table 展示
- 业务无关，所有格式化/校验均可配置

### 主要接口
- `readFile(fileInfo: ReadFileInfo): Promise<Record<string, unknown>[]>`
  - 读取 antd Upload 文件，自动识别表头、日期、富文本、公式
  - 仅支持 .xlsx 格式
- `downloadFile(template: SheetTemplate): Promise<void>`
  - 按二维数组写入 Excel，自动应用默认字体
- `downloadDataSource(data, fileName, sheetName, withIndex, map): Promise<void>`
  - 业务主入口，支持对象数组/二维数组/模板对象导出
- `getImportData(dataSource, template): ImportedRow[]`
  - 按模板校验导入数据，自动高亮错误单元格
- `formatSheetData(dataSource, withIndex, map): unknown[][]`
  - 通用数据格式化，支持多种输入类型

### 关键实现片段
```tsx
// 读取 Excel（自动识别日期/富文本/公式单元格）
export function readFile(fileInfo: ReadFileInfo): Promise<Record<string, unknown>[]> {
  // ...existing code...
}

// 导出 Excel（异步，自动应用默认字体）
export async function downloadFile(template: SheetTemplate): Promise<void> {
  // ...existing code...
}

// 校验行数据，错误高亮
function validateRow(item: ImportedRow, template: ExcelTemplate): ImportedRow {
  // ...existing code...
  if (field.type === DataType.number) {
    // ...existing code...
    if (isNaN(num)) {
      item[displayKey] = <span className="text-orange-400">{String(item[key])}</span>
      errors.push(`${field.title}${t('app.operation.upload.download.template.is.number')}`)
    }
    // ...existing code...
  }
  // ...existing code...
}
```

### 迁移注意事项
- 仅支持 .xlsx，不再兼容 .xls
- `downloadFile`/`downloadDataSource` 需 `await` 调用
- 非必填数字字段留空时返回 `''`，消费方如需默认 0 请自行处理
- 校验错误高亮直接返回 JSX，Table 渲染无需额外处理
- UTC 时间转换依赖 dayjs + utc 插件，已在 excel.tsx 内部注册

---

*如需详细代码请直接查阅 src/utils/excel.tsx，所有核心逻辑已在此文件实现。*

---

*最后更新：2026-03-01*

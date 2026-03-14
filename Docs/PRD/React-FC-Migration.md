# React.FC 迁移至函数写法指南

> 依据《UI-Standards.md》核心原则第 7 条：禁止 React.FC，必须使用函数组件 + 显式 Props 类型。  
> 本文档列出需修改的文件与组件，并给出迁移示例。

---

## 一、需修改的文件与组件清单

以下文件含有 `React.FC` 或 `: React.FC` 写法，需改为函数声明或带显式类型的箭头函数。**不包含**类组件 `ErrorBoundary`（按规定保留）。

| 序号 | 文件路径 | 组件名（该文件内需改的组件） | 状态 |
|------|----------|------------------------------|------|
| 1 | `src/main.tsx` | `GlobalAppSetup` | ✅ 已完成 |
| 2 | `src/layouts/MainLayout.tsx` | `MainLayout` | ✅ 已完成 |
| 3 | `src/components/Footer/index.tsx` | `Footer` | ✅ 已完成 |
| 4 | `src/components/IconFont.tsx` | `IconFont` | ✅ 已完成 |
| 5 | `src/components/HeaderDropdown/index.tsx` | `HeaderDropdown` | ✅ 已完成 |
| 6 | `src/components/RightContent/index.tsx` | `Question`、`SelectLang` | ✅ 已完成 |
| 7 | `src/components/RightContent/AvatarDropdown.tsx` | `AvatarName`、`AvatarDropdown` | ✅ 已完成 |
| 8 | `src/pages/home/index.tsx` | `HomePage` | ✅ 已完成 |
| 9 | `src/pages/welcome/index.tsx` | `InfoCard`、`WelcomePage` | ✅ 已完成 |
| 10 | `src/pages/login/index.tsx` | `LoginMessage`、`LoginPage` | ✅ 已完成 |
| 11 | `src/pages/not-found/index.tsx` | `NotFoundPage` | ✅ 已完成 |
| 12 | `src/pages/account/center/index.tsx` | `TagList`、`IconText`、`ArticlesTab`、`ApplicationsTab`、`ProjectsTab`、`AccountCenterPage` | ✅ 已完成 |
| 13 | `src/pages/account/settings/index.tsx` | `AccountSettingsPage` | ✅ 已完成 |
| 14 | `src/pages/form/basic-form/index.tsx` | `BasicFormPage` | ✅ 已完成 |
| 15 | `src/pages/form/advanced-form/index.tsx` | `AdvancedFormPage` | ✅ 已完成 |
| 16 | `src/pages/form/step-form/index.tsx` | `StepDescriptions`、`StepFormPage` | ✅ 已完成 |
| 17 | `src/pages/analysis/index.tsx` | `AnalysisPage` | ✅ 已完成 |
| 18 | `src/pages/dashboard/monitor/index.tsx` | `MonitorPage` | ✅ 已完成 |
| 19 | `src/pages/dashboard/workplace/index.tsx` | `WorkplacePage` | ✅ 已完成 |
| 20 | `src/pages/list/basic-list/index.tsx` | `ListContent`、`MoreBtn`、`BasicListPage` | ✅ 已完成 |
| 21 | `src/pages/list/card-list/index.tsx` | `CardListPage` | ✅ 已完成 |
| 22 | `src/pages/list/rule-list/index.tsx` | `RuleListPage` | ✅ 已完成 |
| 23 | `src/pages/list/search/index.tsx` | `IconText`、`ArticleListItem`、`SearchListPage` | ✅ 已完成 |
| 24 | `src/pages/profile/basic/index.tsx` | `ProfileBasicPage` | ✅ 已完成 |
| 25 | `src/pages/profile/advanced/index.tsx` | `AdvancedProfilePage` | ✅ 已完成 |
| 26 | `src/pages/result/success/index.tsx` | `ResultSuccess` | ✅ 已完成 |
| 27 | `src/pages/result/fail/index.tsx` | `ResultFail` | ✅ 已完成 |
| 28 | `src/pages/exception/403/index.tsx` | `Exception403` | ✅ 已完成 |
| 29 | `src/pages/exception/404/index.tsx` | `Exception404` | ✅ 已完成 |
| 30 | `src/pages/exception/500/index.tsx` | `Exception500` | ✅ 已完成 |
| 31 | `src/pages/system/org/index.tsx` | `OrgNodeCard`、`OrgSubTree`、`OrgPage` | ✅ 已完成 |

**合计**：31 个文件，约 50+ 处组件定义需从 `React.FC` 改为函数写法。

**不修改**：
- `src/components/ErrorBoundary/index.tsx`：错误边界按规定保留类组件。
- `src/utils/request.ts` 中的 `ApiError`：非 React 组件，无需修改。

---

## 二、迁移写法示例

### 2.1 无 Props 的页面级组件

**Before：**
```tsx
const HomePage: React.FC = () => {
  return <PageContainer title="首页">...</PageContainer>
}
export default HomePage
```

**After：**
```tsx
function HomePage() {
  return <PageContainer title="首页">...</PageContainer>
}
export default HomePage
```

---

### 2.2 无 Props 的导出组件

**Before：**
```tsx
export const Footer: React.FC = () => (
  <div>...</div>
)
```

**After：**
```tsx
export function Footer() {
  return <div>...</div>
}
```

---

### 2.3 有 Props，接口已存在

**Before：**
```tsx
export const AvatarDropdown: React.FC<AvatarDropdownProps> = ({ menu, showName = true }) => {
  // ...
}
```

**After：**
```tsx
export function AvatarDropdown({ menu, showName = true }: AvatarDropdownProps) {
  // ...
}
```

---

### 2.4 有 Props，内联类型

**Before：**
```tsx
const LoginMessage: React.FC<{ content: string }> = ({ content }) => (
  <div>{content}</div>
)
```

**After：**
```tsx
function LoginMessage({ content }: { content: string }) {
  return <div>{content}</div>
}
```

---

### 2.5 有 Props，推荐抽成 interface

**Before：**
```tsx
const TagList: React.FC<{ tags: TagItem[] }> = ({ tags: initTags }) => { ... }
```

**After：**
```tsx
interface TagListProps {
  tags: TagItem[]
}
function TagList({ tags: initTags }: TagListProps) {
  // ...
}
```

---

### 2.6 仅透传 props（如 IconFont）

**Before：**
```tsx
const IconFont: React.FC<IconFontProps> = (props) => {
  return <IconFontInner {...props} />
}
```

**After：**
```tsx
function IconFont(props: IconFontProps) {
  return <IconFontInner {...props} />
}
```

---

## 三、迁移步骤建议

1. **按文件逐个修改**：优先改公共组件（`components/`、`layouts/`），再改页面（`pages/`）。
2. **保留默认参数**：如 `showName = true` 仍在参数解构中书写，无需改动。
3. **导出方式**：若原为 `export const X`，可改为 `export function X` 或保持 `export const X = function ...`，与项目现有风格统一即可。
4. **修改后**：运行 `npm run check`（或 `tsc --noEmit && eslint .`）确保无类型与 lint 报错。

---

## 四、清单汇总（仅路径，便于脚本/检索）

```
src/main.tsx
src/layouts/MainLayout.tsx
src/components/Footer/index.tsx
src/components/IconFont.tsx
src/components/HeaderDropdown/index.tsx
src/components/RightContent/index.tsx
src/components/RightContent/AvatarDropdown.tsx
src/pages/home/index.tsx
src/pages/welcome/index.tsx
src/pages/login/index.tsx
src/pages/not-found/index.tsx
src/pages/account/center/index.tsx
src/pages/account/settings/index.tsx
src/pages/form/basic-form/index.tsx
src/pages/form/advanced-form/index.tsx
src/pages/form/step-form/index.tsx
src/pages/analysis/index.tsx
src/pages/dashboard/monitor/index.tsx
src/pages/dashboard/workplace/index.tsx
src/pages/list/basic-list/index.tsx
src/pages/list/card-list/index.tsx
src/pages/list/rule-list/index.tsx
src/pages/list/search/index.tsx
src/pages/profile/basic/index.tsx
src/pages/profile/advanced/index.tsx
src/pages/result/success/index.tsx
src/pages/result/fail/index.tsx
src/pages/exception/403/index.tsx
src/pages/exception/404/index.tsx
src/pages/exception/500/index.tsx
src/pages/system/org/index.tsx
```

以上 31 个文件为本次 React.FC 迁移范围，**均已按函数写法完成迁移**。

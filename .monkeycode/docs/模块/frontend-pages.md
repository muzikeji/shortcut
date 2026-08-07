# frontend/src/pages/

前端页面组件，每个文件对应一个前端路由。

## 结构

```
pages/
├── types.ts            # 共享 TypeScript 类型定义 + CATEGORIES 常量
├── Home.tsx            # 首页 -- 快捷指令列表（分页/搜索/排序/筛选）
├── Login.tsx           # 登录页
├── Register.tsx        # 注册页
├── ShortcutDetail.tsx  # 快捷指令详情页（533 行，含编辑/评论区/版本面板/相似推荐）
├── Share.tsx           # 发布快捷指令页
├── UserProfile.tsx     # 用户主页（资料/密码/编辑/退出/管理入口）
└── Admin.tsx           # 管理后台（46 行，tab 路由分发到子组件）
```

## 关键文件

| 文件 | 目的 |
|------|------|
| `types.ts` | 定义 `Shortcut`, `Comment`, `User` 接口和 `CATEGORIES` 常量数组 |
| `Home.tsx` | 首页，支持关键词搜索、排序切换（最新/最热/最多下载）、自适应卡片网格、点赞、分页导航；卡片标题/分类徽章使用主题色，空状态根据筛选动态变化 |
| `ShortcutDetail.tsx` | 详情页（533 行），组合 `CommentSection`、`VersionPanel`、`ShortcutEditForm`、`PermissionIcon` 子组件。含点赞、评论、编辑模式、下架/恢复、版本历史、更新版本、相似推荐、统计表格 |
| `UserProfile.tsx` | 个人主页，含头像上传（2MB 限制）、资料编辑、密码修改、管理员"管理"入口、退出登录按钮 |
| `Admin.tsx` | 管理后台（46 行），通过 `isOwner` 控制标签显示，路由分发到 5 个子组件：`SiteSettings`（仅 owner）、`PendingReview`、`UserManagement`、`ShortcutManagement`、`UpdateSystem`（仅 owner） |
| `Share.tsx` | 发布页，iCloud URL 正则校验，粘贴链接后自动调用 fetch-name 识别真实名称与主题色，生成 10 位时间戳 slug |

## 发布页工作流（Share.tsx）

1. 进入页面即生成 `Math.floor(Date.now()/1000)` 的 10 位 slug 并固定
2. 用户粘贴 iCloud 链接后自动调用 `api.fetchShortcutName(url)`，成功后填入真实名称和主题色
3. 提交发布携带 `{ title, slug, color, url, category }`；slug 冲突时自动重新生成
4. 发布成功跳转 `/shortcut/{slug}`

## 主题色应用

页面通过以下模式应用快捷指令主题色（`shortcut.color`, `#RRGGBB`）：

```typescript
const theme = /^#[0-9a-fA-F]{6}$/.test(shortcut.color || '') ? shortcut.color : '#3B82F6';
```

- 纯色文字/背景：`style={{ color: theme }}`、`style={{ backgroundColor: theme }}`
- 浅色底/边框：`${theme}1A` 徽章底、`${theme}40` 边框、`${theme}08` 卡片浅背景、`${theme}14` 权限标签底

## 依赖

**本模块依赖**:
- `../api.ts` -- 所有数据请求
- `../AuthContext.tsx` -- 通过 `useAuth()` 获取当前用户和认证方法
- `../ToastContext.tsx` -- 通过 `useToast()` 获取 toast/confirm 方法
- `../components/admin/*` -- Admin.tsx 使用 5 个管理子组件
- `../components/shortcut/*` -- ShortcutDetail.tsx 使用 4 个快捷指令子组件
- `react-router-dom` -- `useParams`, `Link`, `useNavigate`
- `types.ts` -- 共享类型

**依赖本模块的**:
- `../App.tsx` -- 路由配置引用所有页面组件

## 规范

### 数据加载模式

```typescript
useEffect(() => {
  Promise.all([
    api.getShortcut(id),
    api.getComments(id),
  ]).then(([shortcut, comments]) => { /* ... */ });
}, [id]);
```

### 状态管理

- 使用 `useState` 管理组件内局部状态
- 认证状态通过 `useAuth()` 从 Context 获取
- Toast 通知通过 `useToast()` 从 Context 获取

### 权限控制

通过 `isOwner`（`currentUser.id === resource.user_id`）、`isAdmin`（`role === 'admin'`）、`isOwnerRole`（`role === 'owner'`）判断控制 UI 元素的可见性。

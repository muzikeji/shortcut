# frontend/src/pages/

前端页面组件，每个文件对应一个前端路由。

## 结构

```
pages/
├── types.ts            # 共享 TypeScript 类型定义
├── Home.tsx            # 首页 -- 快捷指令列表（分页/搜索/排序）
├── Login.tsx           # 登录页
├── Register.tsx        # 注册页
├── ShortcutDetail.tsx  # 快捷指令详情页（含评论区）
├── Share.tsx           # 发布快捷指令页
├── UserProfile.tsx     # 用户主页（资料/密码/编辑/退出/管理）
└── Admin.tsx           # 管理后台（用户管理+分享管理两个子组件）
```

## 关键文件

| 文件 | 目的 |
|------|------|
| `types.ts` | 定义 `Shortcut`, `ShortcutVersion`, `Comment`, `AdminUser` 四个接口和 `CATEGORY_COLORS` 常量（已被主题色方案取代，页面不再使用） |
| `Home.tsx` | 首页，支持关键词搜索、排序切换（最新/最热/最多下载）、自适应卡片网格、点赞、分页导航；卡片标题/分类徽章/用户名/获取链接使用 `s.color` 主题色 |
| `ShortcutDetail.tsx` | 详情页，含点赞、评论发表/删除（第 5 条后折叠）、编辑模式、下架/恢复、版本历史、更新版本、相似推荐（大屏右侧栏/小屏下方）；下载按钮/评论头像/分类徽章用主题色，下载按钮下方渲染统计表格（操作步骤/文件大小/访问权限，权限带图标） |
| `UserProfile.tsx` | 个人主页，含头像上传（multer, 2MB 限制）、资料编辑、密码修改、管理员"管理"入口、退出登录按钮 |
| `Admin.tsx` | 管理后台，内嵌 `UserManagement`（搜索/封禁/解封/新增管理员/角色切换）和 `ShortcutManagement`（搜索/下架/恢复/状态筛选）两个子组件 |
| `Share.tsx` | 发布页，iCloud URL 正则校验，粘贴链接后自动调用 `fetchShortcutName` 识别真实名称与主题色，进入页面即生成 10 位时间戳 slug，顶部注释建议卡片（实时发布时间/固定作品地址/一键复制含 fallback），未登录自动跳转登录页 |
| `Login.tsx` | 居中登录表单，调用 `useAuth().login()` |
| `Register.tsx` | 居中注册表单，两次密码一致性校验，调用 `useAuth().register()` |

## 发布页工作流（Share.tsx）

1. **进入页面**即调用 `generateSlug()` 生成 `Math.floor(Date.now()/1000)` 的 10 位 slug 并固定
2. 发布时间用 `setInterval` 每秒刷新；作品地址 `origin/shortcut/{slug}` 实时预览
3. 用户粘贴 iCloud 链接后，`useEffect` 自动调用 `api.fetchShortcutName(url)`，成功后填入真实名称和主题色（名称输入框已移除）
4. 提交发布时携带 `{ title: 名称, slug, color }`；若后端返回"标识已被使用"，自动重新生成 slug 重试
5. 发布成功跳转 `/shortcut/{slug}`

## 主题色应用

页面通过以下模式应用快捷指令主题色（`shortcut.color`，`#RRGGBB`）：

```typescript
const theme = /^#[0-9a-fA-F]{6}$/.test(shortcut.color || '') ? shortcut.color : '#3B82F6';
```

- 纯色文字/背景：`style={{ color: theme }}`、`style={{ backgroundColor: theme }}`
- 浅色底/边框：颜色 + 透明度十六进制后缀（`${theme}1A` 徽章底、`${theme}40` 边框、`${theme}08` 卡片浅背景、`${theme}14` 权限标签底）

## 依赖

**本模块依赖**:
- `../api.ts` -- 所有数据请求
- `../AuthContext.tsx` -- 通过 `useAuth()` 获取当前用户和认证方法
- `react-router-dom` -- `useParams`, `Link`, `useNavigate`
- `types.ts` -- 共享类型

**依赖本模块的**:
- `../App.tsx` -- 路由配置引用所有页面组件

## 规范

### 数据加载模式

组件挂载时通过 `useEffect` 调用 API，使用 `Promise.all` 并行加载多个数据源：

```typescript
useEffect(() => {
  Promise.all([
    api.getShortcut(id),
    api.getComments(id),
  ]).then(([shortcut, comments]) => {
    // ...
  });
}, [id]);
```

### 状态管理模式

使用 `useState` 管理组件内局部状态，认证状态通过 `useAuth()` 从 Context 获取。无外部状态管理库。

### 权限控制

多处通过 `isOwner`（`currentUser.id === resource.user_id`）和 `isAdmin`（`currentUser.role === 'admin'`）判断控制 UI 元素的可见性。

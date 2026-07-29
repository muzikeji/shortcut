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
| `types.ts` | 定义 `Shortcut`, `Comment`, `AdminUser` 三个接口，所有页面和 api.ts 共用 |
| `Home.tsx` | 首页，支持关键词搜索、排序切换（最新/最热/最多下载）、3 列卡片网格、点赞、分页导航 |
| `ShortcutDetail.tsx` | 详情页，含点赞、评论发表/删除、编辑模式（标题/分类/描述）、下架/恢复、已下架时评论关闭 |
| `UserProfile.tsx` | 个人主页，含头像上传（multer, 2MB 限制）、资料编辑、密码修改、管理员"管理"入口、退出登录按钮 |
| `Admin.tsx` | 管理后台，内嵌 `UserManagement`（封禁/解封）和 `ShortcutManagement`（下架/恢复/状态筛选）两个子组件 |
| `Share.tsx` | 发布页，iCloud URL 正则校验，7 个分类按钮组，未登录自动跳转登录页 |
| `Login.tsx` | 居中登录表单，调用 `useAuth().login()` |
| `Register.tsx` | 居中注册表单，两次密码一致性校验，调用 `useAuth().register()` |

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

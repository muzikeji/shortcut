# frontend/src/components/

前端共享 UI 组件，分为全局组件和管理/快捷指令子组件目录。

## 结构

```
components/
├── Navbar.tsx                   # 顶部导航栏（sticky）
├── Footer.tsx                   # 底部页脚
├── admin/                       # 管理后台子组件（Admin.tsx 拆分）
│   ├── SiteSettings.tsx         # 站点设置（仅 owner 可见）
│   ├── PendingReview.tsx        # 待审核快捷指令列表
│   ├── UserManagement.tsx       # 用户管理（搜索/角色变更/封禁）
│   ├── ShortcutManagement.tsx   # 快捷指令管理（搜索/删除）
│   └── UpdateSystem.tsx         # 系统升级（仅 owner 可见）
└── shortcut/                    # 快捷指令子组件（ShortcutDetail.tsx 拆分）
    ├── CommentSection.tsx       # 评论区（发表/删除/嵌套回复/折叠）
    ├── VersionPanel.tsx         # 版本历史面板
    ├── ShortcutEditForm.tsx     # 快捷指令编辑表单
    └── PermissionIcon.tsx       # 权限图标展示
```

## 全局组件

| 文件 | 目的 |
|------|------|
| `Navbar.tsx` | 全局导航栏，sticky 定位。包含 logo、搜索框、发布按钮（登录后）、用户头像/用户名链接（登录后）、登录/注册入口（未登录） |
| `Footer.tsx` | 静态页脚，显示版权信息 |

## 管理后台子组件（admin/）

拆分自 Admin.tsx（原 914 行 → 46 行），通过 props 传递数据：

| 组件 | 目的 | 角色限制 |
|------|------|---------|
| `SiteSettings.tsx` | 站点名称、SEO、ICP、企业微信配置的读取和修改 | owner |
| `PendingReview.tsx` | 待审核快捷指令列表，支持通过/拒绝操作 | admin+ |
| `UserManagement.tsx` | 用户搜索、创建（仅 owner）、角色变更（仅 owner）、封禁/解封 | admin+ |
| `ShortcutManagement.tsx` | 快捷指令搜索、删除管理 | admin+ |
| `UpdateSystem.tsx` | 检查新版本、执行在线升级 | owner |

## 快捷指令子组件（shortcut/）

拆分自 ShortcutDetail.tsx（原 1004 行 → 533 行）：

| 组件 | 目的 |
|------|------|
| `CommentSection.tsx` | 评论列表展示、发表评论、删除评论、嵌套回复支持 |
| `VersionPanel.tsx` | 版本历史列表、添加新版本 |
| `ShortcutEditForm.tsx` | 快捷指令标题/描述/分类编辑表单 |
| `PermissionIcon.tsx` | 快捷指令权限图标的可视化展示 |

## 依赖

**本模块依赖**:
- `../AuthContext.tsx` -- 通过 `useAuth()` 获取用户状态
- `../ToastContext.tsx` -- 通过 `useToast()` 获取 toast/confirm
- `react-router-dom` -- `Link`, `useNavigate`

**依赖本模块的**:
- `../App.tsx` -- 布局中引用 Navbar, Footer
- `../pages/Admin.tsx` -- 引用所有 admin/ 子组件
- `../pages/ShortcutDetail.tsx` -- 引用所有 shortcut/ 子组件

## 规范

### 组件通信

子组件通过 props 接收数据和回调函数，不直接调用 Context：

```tsx
// Admin.tsx 向子组件传递数据
<UserManagement users={users} onRefresh={loadUsers} isOwner={isOwner} />

// ShortcutDetail.tsx 向子组件传递数据
<CommentSection shortcutId={id} comments={comments} onCommentAdded={refresh} />
```

### 响应式设计

使用 Tailwind 响应式前缀控制移动端和桌面端的显示差异。

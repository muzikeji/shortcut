# 捷径社区 -- 文档索引

捷径社区是一个 iOS 快捷指令分享平台，用户可发布、浏览、下载和评论快捷指令（Shortcut）。系统采用前后端分离架构（React 19 + PHP），以 SQLite/MySQL 双驱动为数据存储，JWT 做身份认证，三级角色（站长/管理员/用户）管控。

**快速链接**: [架构](./ARCHITECTURE.md) | [接口](./INTERFACES.md) | [开发者指南](./DEVELOPER_GUIDE.md)

---

## 核心文档

### [架构](./ARCHITECTURE.md)
系统设计、技术栈、目录结构、数据库 Schema、数据流。了解系统整体运作的起点。

### [接口](./INTERFACES.md)
全部 HTTP API 端点、请求/响应格式、认证方式、角色权限要求。集成开发的参考手册。

### [开发者指南](./DEVELOPER_GUIDE.md)
环境搭建、开发服务器配置、编码规范、常见任务和部署说明。贡献者必读。

---

## 模块

| 模块 | 描述 | README |
|------|------|--------|
| `php-shortcut/src/routes/` | PHP API 路由层（users/shortcuts/admin/settings/interact/update） | [README](./模块/backend-routes.md) |
| `php-shortcut/src/Auth.php` | JWT 认证类（三级角色） | [README](./模块/auth-middleware.md) |
| `php-shortcut/src/Database.php` | SQLite/MySQL 双驱动数据库封装 | [README](./模块/database.md) |
| `frontend/src/pages/` | 前端页面组件 | [README](./模块/frontend-pages.md) |
| `frontend/src/components/` | 共享 UI 组件（admin/ + shortcut/ 子目录） | [README](./模块/frontend-components.md) |
| `frontend/src/AuthContext.tsx` | 前端认证状态管理 | [README](./模块/auth-context.md) |
| `vendor/rodneyrehm/plist` | 快捷指令文件 plist 解析库 | - |

---

## 核心概念

| 概念 | 描述 |
|------|------|
| [快捷指令 (Shortcut)](./专有概念/Shortcut.md) | 核心实体，用户分享的 iOS 快捷指令条目，含审核状态 |
| [用户 (User)](./专有概念/User.md) | 系统用户，含三级角色（owner/admin/user）和封禁状态 |
| [点赞 (Like)](./专有概念/Like.md) | 用户对快捷指令的点赞交互（toggle 模式） |
| [评论 (Comment)](./专有概念/Comment.md) | 用户对快捷指令的评论，支持嵌套回复 |
| [快捷指令 slug](./专有概念/Shortcut-slug.md) | 10 位秒级时间戳标识符，用于固定不变的详情页 URL |
| [快捷指令统计](./专有概念/Shortcut-stats.md) | 操作步骤数、文件大小、访问权限（解析 plist 获取） |

---

## 最新动态

### v1.3.2（最新）-- 组件化重构与 Toast 通知

- **大组件拆分**：Admin.tsx 914→46 行（5 子组件）、ShortcutDetail.tsx 1004→533 行（4 子组件）
- **Toast 通知**：全局 toast 组件 + ConfirmModal 替代 alert()/confirm()，全站 30+ 处
- **组件目录结构**：`components/admin/`（SiteSettings/PendingReview/UserManagement/ShortcutManagement/UpdateSystem）、`components/shortcut/`（CommentSection/VersionPanel/ShortcutEditForm/PermissionIcon）

### 历史版本

- v1.3.1 - Toast 通知 + ConfirmModal
- v1.3.0 - MySQL 数据库双驱动支持
- v1.2.2 - JWT Secret 从 .env 加载 + error_log + CATEGORIES 集中定义
- v1.2.1 - 首次安装用户自动设为站长
- v1.2.0 - 三级管理员角色体系
- v1.1.0 - 主题色卡片 + 动态空状态 + 审核系统 + 企微通知

---

## 入门指南

### 项目新人

按此路径学习：
1. **[架构](./ARCHITECTURE.md)** - 了解系统全局和技术选型
2. **[核心概念](#核心概念)** - 学习领域术语和实体关系
3. **[开发者指南](./DEVELOPER_GUIDE.md)** - 搭建本地开发环境
4. **[接口](./INTERFACES.md)** - 探索全部 API

### 需要集成

1. **[接口](./INTERFACES.md)** - API 契约和认证方式
2. **[架构](./ARCHITECTURE.md)** - 系统边界和数据流

### 首次贡献

1. **[开发者指南](./DEVELOPER_GUIDE.md)** - 环境搭建和工作流
2. **[常见任务](./DEVELOPER_GUIDE.md#常见任务)** - 分步指南

---

## 快速参考

### 命令

```bash
# 启动 PHP 开发服务器（端口 8080）
cd php-shortcut/public && php -S localhost:8080

# 启动前端开发服务器（端口 5173，代理 API 到 8080）
cd frontend && npm run dev

# 安装 PHP 依赖
cd php-shortcut && composer install

# 构建前端
cd frontend && npm run build

# 前端代码检查
cd frontend && npm run lint
```

### 重要文件

| 文件 | 目的 |
|------|------|
| `php-shortcut/public/index.php` | 后端入口，路由分发 + .env 加载 + CORS |
| `php-shortcut/public/install.php` | Web 安装引导，创建站长账户 |
| `php-shortcut/src/Auth.php` | JWT 认证 + 三级角色校验 |
| `php-shortcut/src/Database.php` | SQLite/MySQL 双驱动 + 表初始化 |
| `php-shortcut/src/routes/shortcuts.php` | 快捷指令 CRUD + 元数据抓取 + plist 解析 |
| `php-shortcut/src/routes/admin.php` | 管理员接口（用户/分享/审核管理） |
| `php-shortcut/src/PlistParser.php` | 快捷指令 .shortcut 文件解析 |
| `php-shortcut/src/Response.php` | JSON 响应辅助类 |
| `frontend/src/App.tsx` | 前端路由和全局布局 |
| `frontend/src/ToastContext.tsx` | Toast 通知上下文 |
| `frontend/src/pages/types.ts` | 共享类型定义 + CATEGORIES 常量 |

### 核心功能入口

| 功能 | 后端路由 | 前端页面 | 角色要求 |
|------|---------|---------|---------|
| 发布快捷指令 | `POST /api/shortcuts/fetch-name` + `POST /api/shortcuts` | `Share.tsx` | user+ |
| 内容审核 | `PUT /api/admin/shortcuts/{id}/approve` | `Admin.tsx` > `PendingReview.tsx` | admin+ |
| 站点设置 | `PUT /api/settings` | `Admin.tsx` > `SiteSettings.tsx` | owner |
| 系统升级 | `POST /api/update/run` | `Admin.tsx` > `UpdateSystem.tsx` | owner |
| 用户管理 | `PUT /api/admin/users/{id}/ban` / `role` | `Admin.tsx` > `UserManagement.tsx` | admin+ / owner |
| 主题色应用 | `decodeIconColor()` 在后端 | `Home.tsx`, `UserProfile.tsx`, `ShortcutDetail.tsx` | - |

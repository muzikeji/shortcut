# 捷径社区 -- 文档索引

捷径社区是一个 iOS 快捷指令分享平台，用户可发布、浏览、下载和评论快捷指令（Shortcut）。系统采用前后端分离架构（React 19 + Express 4），以 SQLite 为数据存储，JWT 做身份认证。

**快速链接**: [架构](./ARCHITECTURE.md) | [接口](./INTERFACES.md) | [开发者指南](./DEVELOPER_GUIDE.md)

---

## 核心文档

### [架构](./ARCHITECTURE.md)
系统设计、技术栈、组件结构、数据库 Schema。了解系统整体运作的起点。

### [接口](./INTERFACES.md)
全部 HTTP API 端点、请求/响应格式、认证方式。集成开发的参考手册。

### [开发者指南](./DEVELOPER_GUIDE.md)
环境搭建、开发服务器启动、编码规范、常见任务和部署说明。贡献者必读。

---

## 模块

| 模块 | 描述 | README |
|------|------|--------|
| `backend/src/routes/` | API 路由层，处理 HTTP 请求 | [README](./模块/backend-routes.md) |
| `backend/src/auth.js` | JWT 认证中间件 | [README](./模块/auth-middleware.md) |
| `backend/src/database.js` | SQLite 数据库初始化和 Schema | [README](./模块/database.md) |
| `frontend/src/pages/` | 前端页面组件 | [README](./模块/frontend-pages.md) |
| `frontend/src/components/` | 共享 UI 组件 | [README](./模块/frontend-components.md) |
| `frontend/src/AuthContext.tsx` | 前端认证状态管理 | [README](./模块/auth-context.md) |

---

## 核心概念

| 概念 | 描述 |
|------|------|
| [快捷指令 (Shortcut)](./专有概念/Shortcut.md) | 核心实体，用户分享的 iOS 快捷指令条目 |
| [用户 (User)](./专有概念/User.md) | 系统用户，含角色（普通用户/管理员）和封禁状态 |
| [点赞 (Like)](./专有概念/Like.md) | 用户对快捷指令的点赞交互（toggle 模式） |
| [评论 (Comment)](./专有概念/Comment.md) | 用户对快捷指令的评论 |

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
# 启动后端（端口 3001）
cd backend && npm run dev

# 启动前端（端口 5173，自动代理到后端）
cd frontend && npm run dev

# 构建前端
cd frontend && npm run build

# 代码检查
cd frontend && npm run lint
```

### 重要文件

| 文件 | 目的 |
|------|------|
| `backend/src/index.js` | 后端入口，Express 应用装配 |
| `backend/src/database.js` | 数据库初始化和 Schema 定义 |
| `backend/src/auth.js` | JWT 认证中间件 |
| `frontend/src/main.tsx` | 前端入口 |
| `frontend/src/App.tsx` | 路由配置和全局布局 |
| `frontend/src/api.ts` | 前端 API 调用封装 |
| `frontend/src/AuthContext.tsx` | 前端认证状态管理 |
| `frontend/vite.config.ts` | Vite 构建配置和反向代理 |

# 开发者指南

## 项目目的

捷径社区是 iOS 快捷指令分享平台，用户可以发布 iCloud 快捷指令链接、浏览和下载他人分享的指令、进行点赞和评论互动。系统包含完整的用户管理（注册/登录/资料维护）和内容管理（发布/下架/恢复/封禁）。

**核心职责**:
- 快捷指令的发布、浏览、搜索和下载
- 用户认证、资料管理和头像上传
- 点赞和评论互动
- 管理员内容审核和用户管理

---

## 环境搭建

### 前置条件

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 克隆仓库
git clone https://github.com/muzikeji/shortcut.git
cd shortcut

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 环境变量

项目无 `.env.example` 文件，后端有两个可配置的环境变量，均有默认值：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 后端监听端口 |
| `JWT_SECRET` | `shortcut-community-secret-key-2024` | JWT 签名密钥（生产环境务必更换为强随机值） |

生产环境建议通过环境变量设置强随机密钥：
```bash
export JWT_SECRET="$(openssl rand -hex 32)"
```

### 运行

```bash
# 启动后端（端口 3001）
cd backend && npm run dev

# 另开终端启动前端（端口 5173）
cd frontend && npm run dev
```

前端通过 Vite 反向代理转发 `/api` 请求到后端，无需额外配置 CORS。

```bash
# 生产构建
cd frontend && npm run build

# 生产运行（后端托管前端静态文件 + API）
cd backend && npm start
```

---

## 开发工作流

### 代码质量工具

| 工具 | 命令 | 目的 |
|------|------|------|
| TypeScript | `npm run build` (含 `tsc -b`) | 前端类型检查 |
| Oxlint | `npm run lint` | 前端代码检查 |

后端无类型检查或 Lint 工具。

### 分支策略

- `main` -- 生产就绪代码，直接部署

### Pull Request 流程

1. 从 `main` 创建功能分支
2. 编写代码和测试
3. 前端修改运行 `npm run lint` 和 `npm run build` 确保编译通过
4. 创建 PR 并填写描述

---

## 前后端通信说明

开发环境下前端 Vite Dev Server（5173 端口）配置了反向代理：

```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
    '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

前端 `api.ts` 中所有请求使用相对路径（`/api/...`），开发时由 Vite 代理至后端。

---

## 常见任务

### 添加新 API 端点

**后端 -- 需修改的文件**:
1. `backend/src/routes/` -- 在对应路由文件中添加路由处理函数
2. `backend/src/index.js` -- 如果是新路由文件，需要引入并挂载

**前端 -- 需修改的文件**:
1. `frontend/src/api.ts` -- 添加对应的 API 调用函数
2. `frontend/src/pages/` -- 在页面组件中调用新 API

**示例提交**: `feat(api): add user avatar delete endpoint`

### 添加新前端页面

**需修改的文件**:
1. `frontend/src/pages/NewPage.tsx` -- 新建页面组件
2. `frontend/src/App.tsx` -- 添加 Route 配置
3. 如果页面需要导航入口，修改 `frontend/src/components/Navbar.tsx`

### 添加新数据库表

**需修改的文件**:
1. `backend/src/database.js` -- 在 `initTables()` 中添加 CREATE TABLE 语句
2. 在对应路由文件中添加 CRUD 操作代码

**注意**: 如果表已存在，better-sqlite3 使用 `IF NOT EXISTS` 保证幂等性不会重复创建，但不会自动执行 ALTER TABLE 添加新列。如需添加字段，需手动在 `initTables()` 中添加 `ALTER TABLE ... ADD COLUMN` 迁移语句（用 `try { db.exec(...) } catch {}` 包裹以忽略"列已存在"错误）。

### 修改数据库 Schema

在 `backend/src/database.js` 的 `initTables()` 中有多条 `ALTER TABLE` 语句：

```javascript
// 添加 role 字段
db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
```

新增字段的 ALTER TABLE 语句需添加在对应 CREATE TABLE 之后。为确保幂等，可先检查列是否存在。

### 修改环境变量

1. 在后端代码中使用 `process.env.VAR_NAME` 读取
2. 在本文件的环境变量表格中添加文档说明
3. 设置合理的默认值以确保不传变量时也能正常运行

### 部署到生产服务器

当前生产服务器: `192.168.0.108` (Ubuntu 20.04 ARM64)

```bash
# 在服务器拉取最新代码
cd ~/shortcut && git pull

# 重新构建前端（含 TypeScript 类型检查）
cd ~/shortcut/frontend && npm install && npm run build

# 重启后端
cd ~/shortcut/backend && npm install && pm2 restart shortcut
```

> **注意**: 前端生产构建会执行 `tsc -b` 类型检查，且启用了 `noUnusedLocals`。任何未使用的变量/导入都会导致构建失败（TS6133），修改前端代码后务必先本地验证 `npx tsc -b` 通过再提交。

生产模式下 Express 自动检测并托管 `frontend/dist/` 静态文件，SPA 路由自动 fallback。

### 元数据抓取与统计解析

后端在发布快捷指令时通过 Apple 公开接口抓取元数据：

1. **CloudKit API**: `GET https://www.icloud.com/shortcuts/api/records/{id}?locale=zh_CN`，返回指令名称（`fields.name.value`）、图标颜色（`fields.icon_color.value`，0xRRGGBBAA 数字）和指令文件下载地址（`fields.shortcut.value.downloadURL`，未加密 bplist）
2. **plist 解析**: 下载指令文件后用 `bplist-parser` 解析，读取 `WFWorkflowActions` 数组统计操作步骤数，通过 `WFWorkflowActionIdentifier` 的动作映射到权限标签

注意：`signedShortcut` 字段是 AEA1 加密容器无法解析，必须使用未加密的 `shortcut` 字段。抓取超时限制为 8 秒（元数据）/ 15 秒（统计），失败时静默降级（名称回退到用户输入、无颜色回退默认蓝、无统计不渲染表格）。

---

## 编码规范

### 文件组织（前端）

- 每个页面一个 `.tsx` 文件，放在 `pages/` 目录
- 共享组件放在 `components/` 目录
- 共享类型定义在 `pages/types.ts`
- API 调用封装在 `api.ts`

### 命名

| 类型 | 约定 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `UserProfile` |
| 函数/方法 | camelCase | `handleLike` |
| API 函数 | camelCase | `api.getShortcuts()` |
| 路由参数 | camelCase | `:shortcutId` |

### 错误处理（后端）

```javascript
// 推荐：返回明确的错误信息和 HTTP 状态码
res.status(400).json({ error: '请输入有效的 iCloud 链接' });

// 服务器错误使用 500
res.status(500).json({ error: '服务器内部错误' });
```

### 前端状态管理

- 页面级状态使用 `useState`
- 跨组件认证状态使用 `AuthContext` (`useAuth()` hook)
- 无需额外状态管理库

### 样式

- 使用 Tailwind CSS 原子类
- 常用颜色变量通过 Tailwind 类名实现（如 `bg-blue-600`, `text-gray-400`）
- 卡片、详情页按钮等元素的主题色来自快捷指令图标的 `color` 字段（`#RRGGBB`），通过内联 `style={{ color: theme }}`、`style={{ backgroundColor: theme }}` 应用，并配合透明度后缀生成浅色底（如 `${theme}1A`、`${theme}08`）；无颜色时回退默认蓝 `#3B82F6`
- `CATEGORY_COLORS` 常量仍定义在 `types.ts` 但已被主题色方案取代，页面不再直接使用（注意：删了 import 即触发 TS6133）

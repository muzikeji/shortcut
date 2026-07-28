# 捷径社区 - iOS 快捷指令分享社区

一个面向 iOS 用户的快捷指令（Shortcuts）分享社区网站。用户可以注册账号分享自己制作的快捷指令，浏览和下载他人分享的指令，通过点赞和评论进行互动。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | React 19 + Vite 8 + TypeScript + Tailwind CSS 4 |
| 后端 | Node.js + Express 4 |
| 数据库 | SQLite（通过 better-sqlite3） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |
| 文件上传 | Multer |

## 项目结构

```
shortcut-community/
├── backend/
│   ├── src/
│   │   ├── index.js           # 服务入口
│   │   ├── database.js        # SQLite 数据库初始化
│   │   ├── auth.js            # JWT 认证中间件
│   │   └── routes/
│   │       ├── user.js        # 用户注册/登录
│   │       ├── shortcut.js    # 快捷指令 CRUD / 下载
│   │       └── interact.js    # 点赞 / 评论
│   ├── data/                  # SQLite 数据库文件（自动创建）
│   ├── uploads/               # 快捷指令文件上传目录（自动创建）
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api.ts             # API 请求封装
    │   ├── AuthContext.tsx     # 全局认证状态管理
    │   ├── pages/
    │   │   ├── Home.tsx           # 首页（列表 / 搜索 / 排序）
    │   │   ├── Login.tsx          # 登录页
    │   │   ├── Register.tsx       # 注册页
    │   │   ├── ShortcutDetail.tsx # 详情页（下载 / 点赞 / 评论）
    │   │   ├── Share.tsx          # 分享页（上传）
    │   │   └── types.ts
    │   └── components/
    │       ├── Navbar.tsx     # 导航栏
    │       └── Footer.tsx     # 页脚
    ├── vite.config.ts         # Vite 配置（含反向代理）
    └── package.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
# 安装后端依赖
cd shortcut-community/backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动开发服务器

后端（默认端口 3001）：

```bash
cd shortcut-community/backend
npm run dev
```

前端（默认端口 5173）：

```bash
cd shortcut-community/frontend
npm run dev
```

前端 Vite 已配置反向代理，`/api` 请求自动转发到后端 `http://localhost:3001`。

启动后访问 `http://localhost:5173` 即可使用。

### 一键启动

```bash
cd shortcut-community/backend && npm run dev &
cd shortcut-community/frontend && npm run dev
```

### 生产部署

```bash
# 构建前端
cd shortcut-community/frontend
npm run build

# 构建产物在 dist/ 目录，可由后端直接托管或使用 Nginx
```

## 功能说明

### 权限设计

| 功能 | 未登录用户 | 已登录用户 |
|------|-----------|-----------|
| 浏览快捷指令列表 | 支持 | 支持 |
| 搜索快捷指令 | 支持 | 支持 |
| 按最新/最热/下载量排序 | 支持 | 支持 |
| 下载快捷指令 | 支持 | 支持 |
| 查看评论 | 支持 | 支持 |
| 分享快捷指令 | 不支持 | 支持 |
| 点赞/取消点赞 | 不支持 | 支持 |
| 发表评论 | 不支持 | 支持 |
| 删除自己的评论 | N/A | 支持 |

### API 接口

**用户认证**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/users/register` | 注册 | 否 |
| POST | `/api/users/login` | 登录 | 否 |
| GET | `/api/users/me` | 获取当前用户信息 | 是 |

**快捷指令**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/shortcuts` | 列表（支持 `?search=&sort=&page=`） | 否 |
| GET | `/api/shortcuts/:id` | 详情 | 否 |
| POST | `/api/shortcuts` | 分享（multipart/form-data） | 是 |
| GET | `/api/shortcuts/:id/download` | 下载文件 | 否 |
| DELETE | `/api/shortcuts/:id` | 删除（仅限作者） | 是 |

**互动**

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/shortcuts/:id/like` | 切换点赞 | 是 |
| GET | `/api/shortcuts/:id/comments` | 评论列表 | 否 |
| POST | `/api/shortcuts/:id/comments` | 发表评论 | 是 |
| DELETE | `/api/shortcuts/:id/comments/:commentId` | 删除评论 | 是 |

### 分享快捷指令格式

快捷指令文件要求：
- 支持格式：`.shortcut`、`.plist`、`.xml`
- 文件大小限制：10MB
- 可通过 iOS 快捷指令 App 导出 `.shortcut` 文件后上传

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端服务端口 | `3001` |
| `JWT_SECRET` | JWT 签名密钥 | 内置默认值（生产环境务必修改） |

## Vite 配置说明

前端的 `vite.config.ts` 中配置了反向代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

开发时前端请求 `/api/xxx` 会代理到后端 `http://localhost:3001/api/xxx`，生产环境建议使用 Nginx 反向代理或由后端直接托管前端构建产物。

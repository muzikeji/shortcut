# 捷径社区 - iOS 快捷指令分享社区

一个面向 iOS 用户的快捷指令（Shortcuts）分享社区网站。用户可以注册账号发布自己制作的快捷指令，浏览和下载他人分享的指令，通过点赞和评论进行互动。系统支持版本更新、相似推荐、自适应布局和分类主题色。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | React 19 + Vite 8 + TypeScript + Tailwind CSS 4 |
| 后端 | Node.js + Express 4 |
| 数据库 | SQLite（通过 better-sqlite3） |
| 认证 | JWT（jsonwebtoken + bcryptjs） |
| 文件上传 | Multer（头像上传） |

## 项目结构

```
├── backend/
│   ├── src/
│   │   ├── index.js           # 服务入口（托管前端 dist + API + SPA fallback）
│   │   ├── database.js        # SQLite 数据库初始化与 Schema
│   │   ├── auth.js            # JWT 认证中间件（authRequired / authOptional / adminRequired）
│   │   └── routes/
│   │       ├── user.js        # 用户注册/登录/资料/密码/头像
│   │       ├── shortcut.js    # 快捷指令 CRUD / 下架/恢复/版本/相似推荐
│   │       ├── interact.js    # 点赞 / 评论
│   │       └── admin.js       # 管理员（用户管理/角色管理/分享管理）
│   ├── data/                  # SQLite 数据库文件（自动创建）
│   ├── uploads/               # 头像上传目录（自动创建）
│   └── package.json
└── frontend/
    ├── public/
    │   └── logo.png           # 站点 Logo
    ├── src/
    │   ├── api.ts             # API 请求封装（27 个接口）
    │   ├── AuthContext.tsx     # 全局认证状态管理
    │   ├── pages/
    │   │   ├── types.ts           # 共享类型 + CATEGORY_COLORS 主题色
    │   │   ├── Home.tsx           # 首页（自适应网格 / 搜索 / 排序）
    │   │   ├── Login.tsx          # 登录页
    │   │   ├── Register.tsx       # 注册页
    │   │   ├── ShortcutDetail.tsx # 详情页（版本记录/评论折叠/相似推荐）
    │   │   ├── Share.tsx          # 发布页
    │   │   ├── UserProfile.tsx    # 用户主页（资料/退出/管理入口）
    │   │   └── Admin.tsx          # 管理后台（搜索/新增管理员/角色切换）
    │   └── components/
    │       ├── Navbar.tsx     # 导航栏（搜索/Logo/用户头像）
    │       └── Footer.tsx     # 页脚
    ├── vite.config.ts         # Vite 配置（端口/代理/allowedHosts）
    └── package.json
```

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 拉取代码

```bash
git clone https://github.com/muzikeji/shortcut.git
cd shortcut
```

### 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 启动开发服务器

后端（默认端口 3001）：

```bash
cd backend
npm run dev
```

前端（默认端口 5173）：

```bash
cd frontend
npm run dev
```

前端 Vite 已配置反向代理，`/api` 请求自动转发到后端 `http://localhost:3001`。

### 生产部署

```bash
# 构建前端
cd frontend && npm run build

# 启动后端（自动托管前端 dist/ + SPA 路由）
cd ../backend && npm start
```

后端启动后自动检测 `frontend/dist/` 目录，若存在则托管静态文件。访问 `http://localhost:3001` 即可。

**首次部署设置管理员：**

管理员首次可通过数据库直接设置，之后可通过管理后台界面新增管理员或为现有用户设置角色：

```bash
cd ~/shortcut/backend
node -e "
const { getDb } = require('./src/database');
const db = getDb();
db.prepare(\"UPDATE users SET role = 'admin' WHERE username = '你的用户名'\").run();
console.log('已设为管理员');
"
```

**常驻后台运行（pm2）：**

```bash
npm install -g pm2
cd ~/shortcut/backend
pm2 start src/index.js --name shortcut
pm2 save
pm2 startup
```

**更新部署：**

```bash
cd ~/shortcut
git pull
cd frontend && npm run build
pm2 restart shortcut
```

## 功能总览

### 权限矩阵

| 功能 | 游客 | 用户 | 管理员 |
|------|:--:|:--:|:--:|
| 浏览/搜索快捷指令 | ✓ | ✓ | ✓ |
| 按最新/最热/下载量排序 | ✓ | ✓ | ✓ |
| 下载快捷指令 | ✓ | ✓ | ✓ |
| 查看评论 | ✓ | ✓ | ✓ |
| 注册/登录 | ✓ | - | - |
| 发布新快捷指令 | - | ✓ | ✓ |
| 点赞/取消点赞 | - | ✓ | ✓ |
| 发表/删除评论 | - | ✓ | ✓ |
| 修改个人资料/密码 | - | ✓ | ✓ |
| 上传头像 | - | ✓ | ✓ |
| 编辑自己的快捷指令 | - | ✓ | ✓ |
| 更新快捷指令版本 | - | ✓ | ✓ |
| 下架/恢复自己的分享 | - | ✓ | ✓ |
| 进入管理后台 | - | - | ✓ |
| 封禁/解封用户 | - | - | ✓ |
| 下架/恢复任意分享 | - | - | ✓ |
| 新增管理员账号 | - | - | ✓ |
| 设置/取消用户管理员角色 | - | - | ✓ |
| 搜索用户和快捷指令 | - | - | ✓ |

### 特色功能

- **自动抓取真实名称与主题色**：发布时粘贴 iCloud 链接即自动识别快捷指令真实名称和图标颜色，卡片和详情页按主题色渲染
- **统计信息展示**：详情页展示操作步骤数、文件大小、访问权限（发布时解析指令文件）
- **时间戳 slug 链接**：每个快捷指令拥有 10 位秒级时间戳唯一标识，作品地址固定不变
- **发布注释建议**：发布页顶部提供可复制的注释内容（发布者/来源/发布时间/作品地址），一键复制供粘贴到快捷指令
- **版本更新**：发布者可提交新的 iCloud 链接更新快捷指令，浏览者可查看版本历史
- **相似推荐**：详情页根据分类自动推荐 5 条相似快捷指令，大屏右侧展示、小屏下方展示
- **评论折叠**：第 5 条评论后自动折叠，点击展开查看全部
- **自适应布局**：首页/个人主页使用 CSS Grid auto-fill，从手机到超宽屏自适应列数
- **管理搜索**：管理后台支持按用户名/邮箱搜索用户，按标题/作者搜索分享

## API 接口

### 用户认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:--:|
| POST | `/api/users/register` | 注册 | - |
| POST | `/api/users/login` | 登录 | - |
| GET | `/api/users/me` | 获取当前用户信息 | ✓ |
| GET | `/api/users/:id` | 获取用户公开信息 | - |
| PUT | `/api/users/profile` | 修改资料（用户名/邮箱/签名） | ✓ |
| PUT | `/api/users/password` | 修改密码 | ✓ |
| POST | `/api/users/avatar` | 上传头像（multipart, 2MB） | ✓ |

### 快捷指令

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:--:|
| GET | `/api/shortcuts` | 列表（`?search=&sort=&page=&userId=`） | - |
| GET | `/api/shortcuts/:id` | 详情（支持数字 ID 或时间戳 slug） | - |
| POST | `/api/shortcuts/fetch-name` | 预取快捷指令名称/颜色/统计 | - |
| POST | `/api/shortcuts` | 发布（iCloud 链接，可选 slug/color） | ✓ |
| PUT | `/api/shortcuts/:id` | 编辑（标题/描述/分类） | ✓ |
| DELETE | `/api/shortcuts/:id` | 删除（仅限作者） | ✓ |
| PUT | `/api/shortcuts/:id/remove` | 下架（作者或管理员） | ✓ |
| PUT | `/api/shortcuts/:id/restore` | 恢复上架（作者或管理员） | ✓ |
| GET | `/api/shortcuts/:id/download` | 下载/跳转（计数+1 后 302） | - |
| GET | `/api/shortcuts/:id/versions` | 版本历史列表 | - |
| POST | `/api/shortcuts/:id/versions` | 更新版本（新 iCloud 链接） | ✓ |
| GET | `/api/shortcuts/:id/similar` | 相似推荐（同分类 Top 5） | - |

### 互动

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:--:|
| POST | `/api/shortcuts/:id/like` | 切换点赞（Toggle） | ✓ |
| GET | `/api/shortcuts/:id/comments` | 评论列表 | - |
| POST | `/api/shortcuts/:id/comments` | 发表评论 | ✓ |
| DELETE | `/api/shortcuts/:id/comments/:commentId` | 删除评论（仅本人） | ✓ |

### 管理员

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|:--:|
| GET | `/api/admin/users` | 用户列表（`?search=&page=`） | 管理员 |
| POST | `/api/admin/users` | 新增管理员账号 | 管理员 |
| PUT | `/api/admin/users/:id/role` | 设置用户角色 | 管理员 |
| PUT | `/api/admin/users/:id/ban` | 封禁用户（同时下架其所有分享） | 管理员 |
| PUT | `/api/admin/users/:id/unban` | 解封用户 | 管理员 |
| GET | `/api/admin/shortcuts` | 分享列表（`?status=&search=&page=`） | 管理员 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 后端服务端口 | `3001` |
| `JWT_SECRET` | JWT 签名密钥 | 内置默认值（生产务必更换） |

生产环境建议：

```bash
export JWT_SECRET="$(openssl rand -hex 32)"
```

## 数据库

项目使用 SQLite 单文件数据库 `backend/data/shortcuts.db`，包含以下表：

| 表 | 说明 |
|------|------|
| `users` | 用户（username/email/password/avatar/bio/role/banned） |
| `shortcuts` | 快捷指令（title/description/category/file_url/slug/color/stats/status/计数） |
| `shortcut_versions` | 版本历史（shortcut_id/url/version_note/created_at） |
| `likes` | 点赞记录（shortcut_id/user_id, UNIQUE 约束） |
| `comments` | 评论（shortcut_id/user_id/content） |

数据库文件在首次启动时自动创建，表结构和索引通过 `database.js` 中的 `initTables()` 自动初始化。

## Vite 配置说明

`frontend/vite.config.ts` 中配置了以下内容：

```typescript
server: {
  port: 5173,
  allowedHosts: ['.monkeycode-ai.online'],
  proxy: {
    '/api':     { target: 'http://localhost:3001', changeOrigin: true },
    '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
  },
}
```

- 开发时前端请求 `/api/xxx` 转发到后端 `localhost:3001`
- 生产环境由后端 Express 直接托管前端 `dist/` 并处理 SPA 路由

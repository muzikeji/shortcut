# 开发者指南

## 项目目的

捷径社区是 iOS 快捷指令分享平台，用户可以发布 iCloud 快捷指令链接、浏览和下载他人分享的指令、进行点赞和评论互动。系统包含完整的用户管理（注册/登录/资料维护）、三级角色权限和内容审核机制。

**核心职责**:
- 快捷指令的发布、浏览、搜索、下载、版本管理
- 用户认证、三级角色权限、资料管理和头像上传
- 点赞和评论互动（嵌套回复支持）
- 管理员内容审核和用户管理
- 企业微信审核通知
- 站点设置管理
- 在线升级（从 GitHub Releases）

---

## 环境搭建

### 前置条件

- PHP >= 7.4（推荐 8.0+）
- Composer >= 2.x
- PHP 扩展：`pdo_sqlite` 或 `pdo_mysql`, `mbstring`, `json`, `openssl`, `curl`, `xml`, `zip`（ZipArchive 升级功能需要）
- Node.js >= 18（前端开发）
- npm >= 9

### 安装

```bash
# 克隆仓库
git clone https://github.com/muzikeji/shortcut-community-php.git
cd shortcut-community-php

# 安装 PHP 依赖
cd php-shortcut
composer install

# 安装前端依赖
cd ../frontend
npm install
```

### 配置

项目使用 `.env` 文件管理配置。首次运行时复制默认配置：

```bash
cd php-shortcut
cp .env.example .env
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `JWT_SECRET` | `shortcut-community-jwt-secret-change-me` | JWT 签名密钥（生产环境务必更换为强随机值） |
| `DB_DRIVER` | `sqlite` | 数据库驱动：`sqlite` 或 `mysql` |
| `DB_HOST` | `localhost` | MySQL 主机（仅 MySQL 模式） |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_NAME` | `shortcut` | MySQL 数据库名（安装时自动创建） |
| `DB_USER` | `root` | MySQL 用户名 |
| `DB_PASS` | `` | MySQL 密码 |

生产环境建议生成强随机密钥：

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" > php-shortcut/.env
```

### 运行

```bash
# 启动 PHP 开发服务器（端口 8080）
cd php-shortcut/public && php -S localhost:8080

# 另开终端启动前端（端口 5173）
cd frontend && npm run dev
```

前端 Vite Dev Server（5173）已配置反向代理，将 `/api` 和 `/uploads` 请求转发到 PHP 开发服务器。

```bash
# 前端构建
cd frontend && npm run build

# 将构建产物拷贝到 PHP 静态目录（供生产部署）
cp -r frontend/dist/* php-shortcut/frontend/
```

### 首次安装

访问 `http://localhost:8080/install.php` 进入 Web 安装引导：

1. 自动检测 PHP 版本、必需扩展和 Composer 依赖
2. 初始化数据库（SQLite 需要 data/ 可写；MySQL 需要连接权限）
3. 自动建表和迁移
4. 如无管理员，显示创建站长账户表单

安装完成后，使用站长账户登录即可访问管理后台。

---

## 项目配置

### Vite 反向代理

开发环境下 `frontend/vite.config.ts` 将 API 请求转发至 PHP 后端：

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
```

### .htaccess（生产环境 Apache）

```apache
# API 请求重写至 index.php
RewriteRule ^api/(.*)$ index.php [QSA,L]

# SPA 回退：非文件/目录请求重写至 frontend/index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ frontend/index.html [L]
```

### PSR-4 自动加载

```json
{
  "autoload": {
    "psr-4": {
      "Shortcut\\": "src/"
    }
  }
}
```

---

## 开发工作流

### 代码质量工具

| 工具 | 命令 | 目的 |
|------|------|------|
| TypeScript | `npm run build` (含 `tsc -b`) | 前端类型检查 |
| Oxlint | `npm run lint` | 前端代码检查 |

`tsconfig.json` 启用了 `noUnusedLocals`，未使用的变量/导入会导致构建失败（TS6133）。

PHP 后端当前无类型检查或 Lint 工具。

---

## 常见任务

### 添加新 API 端点

**PHP 后端 -- 需修改的文件**:
1. `php-shortcut/src/routes/{module}.php` -- 在对应路由文件中添加处理函数
2. `php-shortcut/public/index.php` -- 在 `routeApi()` 函数中注册路由

路由注册模式（在 `routeApi()` 中）:
```php
case 'api/new-feature':
    // GET /api/new-feature
    requireAuth();  // 或 requireAdmin() / 无需认证
    getNewFeature();
    break;
```

**前端 -- 需修改的文件**:
1. `frontend/src/api.ts` -- 添加对应的 API 调用函数
2. `frontend/src/pages/` -- 在页面组件中调用新 API

### 添加新前端页面

**需修改的文件**:
1. `frontend/src/pages/NewPage.tsx` -- 新建页面组件
2. `frontend/src/App.tsx` -- 添加 Route 配置
3. 如果需要导航入口，修改 `frontend/src/components/Navbar.tsx`

### 添加新数据库表

**需修改的文件**:
1. `php-shortcut/src/Database.php` -- 在 `initSQLiteTables()` 和 `initMySQLTables()` 中分别添加 CREATE TABLE 语句
2. 添加对应索引到 `createMySQLIndex()` 或 SQLite 的 CREATE INDEX
3. 在对应路由文件中添加 CRUD 操作代码

**注意**: `Database::initTables()` 使用 `IF NOT EXISTS` 保证幂等性。添加新列时，在 `install.php` 的 `runMigrations()` 中用 `try { ... } catch {}` 包裹 ALTER TABLE 语句以忽略"列已存在"错误。

### 修改数据库 Schema

在 `Database.php` 的 `initSQLiteTables()` 和 `initMySQLTables()` 中同步修改 CREATE TABLE 语句。新增字段的 ALTER TABLE 迁移语句添加在 `install.php` 的 `runMigrations()` 函数中。

### SQLite 与 MySQL 兼容性

两种数据库共享相同业务逻辑，差异限制在 `Database.php` 内：

| 场景 | SQLite | MySQL |
|------|--------|-------|
| 主键自增 | `INTEGER PRIMARY KEY AUTOINCREMENT` | `INT AUTO_INCREMENT PRIMARY KEY` |
| 冲突更新 | `INSERT ... ON CONFLICT(key) DO UPDATE SET` | `INSERT ... ON DUPLICATE KEY UPDATE` |
| 索引创建 | `CREATE INDEX IF NOT EXISTS` | 在 try/catch 中 `EXECUTE IMMEDIATE`（忽略 42000 错误） |

判断当前驱动：`Database::isMySQL()`。

路由代码中通过 `ON CONFLICT` / `ON DUPLICATE KEY UPDATE` 区分（如 `settings.php` 的 `updateSetting()`）。

### 修改环境变量

1. 在 `php-shortcut/.env` 和 `.env.example` 中添加变量
2. 在 `php-shortcut/public/index.php` 的 `.env` 解析逻辑已自动加载所有行（`putenv()`）
3. 在代码中使用 `getenv('VAR_NAME')` 读取
4. 设置合理的默认值

### 部署到生产服务器

生产服务器通过宝塔面板管理（Apache），站点根目录为 `php-shortcut/public/`。

```bash
# 在服务器拉取最新代码
cd /www/wwwroot/lzcnb.cn && git pull

# 安装 PHP 依赖
composer install --no-dev

# 确保文件属主正确（www 用户可写）
chown -R www:www /www/wwwroot/lzcnb.cn

# 前端重新构建（在本地或服务器）
cd frontend && npm run build && cp -r dist/* ../php-shortcut/frontend/
```

### 元数据抓取与统计解析

后端在发布快捷指令时通过 Apple 公开接口抓取元数据：

1. **CloudKit API**: `GET https://www.icloud.com/shortcuts/api/records/{id}?locale=zh_CN`，返回指令名称（`fields.name.value`）、图标颜色（`fields.icon_color.value`，0xRRGGBBAA 数字）和指令文件下载地址（`fields.shortcut.value.downloadURL`）
2. **plist 解析**: 下载 .shortcut 文件后用 `rodneyrehm/plist` 解析，提取 `WFWorkflowActions` 数组统计操作步骤数，通过 `WFWorkflowActionIdentifier` 映射到权限标签

`decodeIconColor()` 将 iCloud 返回的 0xRRGGBBAA 数字转换为 #RRGGBB 十六进制色值。42 个权限动作映射为中文标签（照片、通讯录、定位、健康等）。

### 角色权限模型

三级角色体系：

| 操作 | user | admin | owner |
|------|------|-------|-------|
| 发布/编辑自己的快捷指令 | 是 | 是 | 是 |
| 查看仪表盘 | - | 是 | 是 |
| 封禁/解封用户 | - | 是（不可操作 admin/owner） | 是 |
| 审核快捷指令 | - | 是 | 是 |
| 新建用户 | - | - | 是 |
| 变更用户角色 | - | - | 是 |
| 站点设置 | - | - | 是 |
| 系统升级 | - | - | 是 |

首次安装（`install.php`）创建的用户自动设为 `role='owner'`。升级到 v1.2.0+ 后需手动将旧管理员提升为 owner。

---

## 编码规范

### PHP 后端

**文件组织**:
- 每个功能模块一个路由文件，放在 `src/routes/`
- 通用类放在 `src/` 根目录（`Auth.php`, `Database.php`, `PlistParser.php`, `Response.php`）
- 入口文件在 `public/index.php`
- 使用命名空间 `Shortcut`，PSR-4 自动加载

**错误处理**:
```php
use Shortcut\Response;

// 推荐：返回明确的错误信息
Response::error('请输入有效的 iCloud 链接', 400);
Response::notFound();  // 404
Response::forbidden(); // 403
Response::unauthorized(); // 401

// 数据库异常
try {
    $db = Database::get();
    // ...
} catch (\PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    Response::error('服务器内部错误', 500);
}
```

**响应**:
```php
Response::json($data);         // 200
Response::json($data, 201);    // 201
Response::error('msg', 400);   // 400
```

### 前端

**文件组织**:
- 每个页面一个 `.tsx` 文件，放在 `pages/`
- 管理后台子组件放在 `components/admin/`
- 快捷指令子组件放在 `components/shortcut/`
- 共享类型定义在 `pages/types.ts`（含 `CATEGORIES` 常量）
- API 调用封装在 `api.ts`
- 全局状态在 `AuthContext.tsx` + `ToastContext.tsx`

**命名**:
| 类型 | 约定 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `UserProfile` |
| 函数/方法 | camelCase | `handleLike` |
| API 函数 | camelCase | `api.getShortcuts()` |
| 路由参数 | camelCase | `:shortcutId` |

**Toast 通知**:
```tsx
const { toast } = useToast();
toast('操作成功');                           // 普通提示（3 秒消失）
const yes = await toast.confirm('确认删除？');  // 确认弹窗，返回 boolean
```

### 样式

- 使用 Tailwind CSS 原子类
- 卡片、详情页按钮等元素的主题色来自快捷指令图标的 `color` 字段（`#RRGGBB`），通过内联 `style={{ color: theme }}`、`style={{ backgroundColor: theme }}` 应用
- 无颜色时回退默认蓝 `#3B82F6`
- `CATEGORIES` 常量定义在 `types.ts`

# backend/src/database.js

SQLite 数据库初始化和 Schema 定义模块。

## 关键文件

| 文件 | 目的 |
|------|------|
| `database.js` | 单体文件，包含数据库连接、Schema 创建和历史字段迁移 |

## 数据库配置

- 使用 `better-sqlite3` 同步驱动
- 数据库文件: `data/shortcuts.db`（相对于 backend 目录）
- 启用 WAL 日志模式（提升并发读取性能）
- 启用外键约束（`PRAGMA foreign_keys = ON`）

## 导出的函数/对象

| 导出 | 说明 |
|------|------|
| `module.exports = { getDb }` | 导出 `getDb()` 工厂函数，首次调用时初始化连接和 Schema 并返回数据库实例（可调用 `db.prepare(...).run(...)`）。单例模式，后续调用返回同一实例 |

## 初始化流程

```javascript
// 1. 创建 data/ 目录（若不存在）
fs.mkdirSync(dataDir, { recursive: true });

// 2. 连接数据库
const db = new Database(path.join(dataDir, 'shortcuts.db'));

// 3. 开启 WAL + 外键
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 4. 创建表和索引（IF NOT EXISTS 保证幂等）
initTables();

// 5. 导出 db 实例
```

## 数据库表

| 表名 | 用途 | 字段数 | 索引数 |
|------|------|--------|--------|
| `users` | 用户账号和资料 | 8 (id/username/email/password/avatar/bio/role/banned) | 0 |
| `shortcuts` | 快捷指令 | 16 (id/slug/title/description/category/file_url/file_name/file_size/download_count/like_count/comment_count/user_id/created_at/status/color/stats) | 3 (user_id, created_at, slug UNIQUE) |
| `likes` | 点赞记录 | 4 | 2 (shortcut_id, user_id) |
| `comments` | 评论内容 | 5 | 1 (shortcut_id) |
| `shortcut_versions` | 版本历史 | 5 (id/shortcut_id/url/version_note/created_at) | 1 (shortcut_id) |

## 历史迁移

`initTables()` 中通过 `ALTER TABLE ... ADD COLUMN` 添加了以下字段（全部用 `try/catch` 包裹，忽略"列已存在"报错，保证幂等）：

- `users.bio` -- 个性签名（默认 `''`）
- `users.role` -- 用户角色（默认 `'user'`）
- `users.banned` -- 封禁标记（默认 `0`）
- `shortcuts.status` -- 状态标记（默认 `'active'`）
- `shortcuts.slug` -- 10 位时间戳唯一标识（迁移后对旧数据回填：`created_at` 时间戳 + 4 位随机数）
- `shortcuts.color` -- 图标主题色（默认 `''`，`#RRGGBB`）
- `shortcuts.stats` -- 统计信息 JSON 字符串（默认 `''`，含 actionCount/size/permissions/actionTypes）

`slug` 列随后创建唯一索引 `idx_shortcuts_slug`，已有记录若 slug 为空则按 `created_at` 时间戳 + 4 位随机数回填。

## 依赖

**本模块依赖**:
- `better-sqlite3` -- 同步 SQLite 驱动
- `fs`, `path` -- 标准库

**依赖本模块的**:
- 所有路由文件 -- 通过 `require('../database')` 获取 db 实例执行查询
- `auth.js` -- 查询用户最新状态

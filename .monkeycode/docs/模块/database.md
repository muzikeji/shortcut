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
| `module.exports = db` | 导出已初始化并创建 Schema 的数据库实例（可直接调用 `db.prepare(...).run(...)`） |

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
| `users` | 用户账号和资料 | 8 | 0 |
| `shortcuts` | 快捷指令 | 13 | 1 (user_id) + 1 (created_at) |
| `likes` | 点赞记录 | 4 | 2 (shortcut_id, user_id) |
| `comments` | 评论内容 | 5 | 1 (shortcut_id) |

## 历史迁移

`initTables()` 中通过 `ALTER TABLE ... ADD COLUMN` 添加了以下字段：

- `users.role` -- 用户角色（默认 `'user'`）
- `users.banned` -- 封禁标记（默认 `0`）
- `users.bio` -- 个性签名
- `shortcuts.status` -- 状态标记（默认 `'active'`）

这些迁移语句在每次启动时执行，因 SQLite 的 `ALTER TABLE ADD COLUMN` 在列已存在时会报错，当前实现未做错误忽略处理（better-sqlite3 的 `exec` 会抛出异常）。如需修复，可先用 `PRAGMA table_info` 检查列是否存在再执行。

## 依赖

**本模块依赖**:
- `better-sqlite3` -- 同步 SQLite 驱动
- `fs`, `path` -- 标准库

**依赖本模块的**:
- 所有路由文件 -- 通过 `require('../database')` 获取 db 实例执行查询
- `auth.js` -- 查询用户最新状态

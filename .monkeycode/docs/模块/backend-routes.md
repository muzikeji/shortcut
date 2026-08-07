# php-shortcut/src/routes/

后端 API 路由层，负责处理 HTTP 请求并调用数据库操作。所有路由函数由 `public/index.php` 的 `routeApi()` 分发调用，无路由框架，直接通过条件分支路由。

## 结构

```
routes/
├── users.php         # 用户管理：注册、登录、资料、密码、头像、登录频率限制
├── shortcuts.php     # 快捷指令管理：CRUD、列表、元数据抓取、统计解析、下架/恢复、下载、版本、相似推荐
├── interact.php      # 互动：点赞 toggle、评论 CRUD（包含嵌套回复支持）
├── admin.php         # 管理员：仪表盘、用户管理、内容审核、快捷指令删除
├── settings.php      # 站点设置：公开读取、管理员读写、企微 webhook 配置
└── update.php        # 在线升级：检查/执行更新、版本查询
```

## 路由分发机制

`public/index.php` 的 `routeApi()` 函数通过条件分支路由请求：

```php
function routeApi(string $method, string $path): void {
    $parts = explode('/', trim($path, '/'));
    // $parts[0] = 模块名, $parts[1] = 资源 ID, $parts[2] = 子资源/动作
    switch ($parts[0]) {
        case 'users':    // 用户相关路由
        case 'auth':     // 向后兼容认证路由
        case 'shortcuts': // 快捷指令路由
        case 'interact':  // 互动路由
        case 'admin':     // 管理路由
        case 'settings':  // 设置路由
        case 'update':    // 升级路由
        case 'version':   // 版本查询
    }
}
```

## 各文件路由数量

| 文件 | 路由数 | 主要功能 |
|------|--------|---------|
| `users.php` | 9 | 注册、登录（含频率限制）、当前用户、用户资料、公开用户信息、编辑资料、修改密码、头像上传、头像文件服务 |
| `shortcuts.php` | 14 | 列表、详情、发布（预取元数据+创建）、编辑、删除、下架/恢复、下载重定向、版本列表/添加、相似推荐、刷新统计 |
| `interact.php` | 4 | 点赞 toggle、评论列表/发布/删除（含嵌套回复和子回复级联） |
| `admin.php` | 11 | 仪表盘、用户列表、创建用户、角色变更、封禁/解封、快捷指令管理列表、待审核、通过/拒绝审核、删除 |
| `settings.php` | 3 | 公开设置读取、完整设置读取（含 token）、设置更新（单键/批量） |
| `update.php` | 3 | 检查更新、执行升级（两阶段）、版本查询 |

## shortcuts.php 关键函数

| 函数 | 说明 |
|------|------|
| `fetchShortcutMeta(url)` | 调 CloudKit API 抓取名称/颜色/指令文件地址 |
| `decodeIconColor($raw)` | 将 0xRRGGBBAA 数字颜色解码为 `#RRGGBB` |
| `isValidShortcutUrl(url)` | 验证 iCloud URL 格式 |
| `sendWechatNotify(db, shortcut, authUser)` | 发送企业微信审核通知 webhook 消息 |
| `findShortcutWithUser(db, value)` | 按 ID 或 slug 查询快捷指令（JOIN users 表） |
| `findShortcut(db, value)` | 按 ID 或 slug 查询快捷指令（仅 shortcuts 表） |

## 依赖

**本模块依赖**:
- `../Database.php` -- 数据库连接（`Database::get()`）
- `../Auth.php` -- 认证方法（`Auth::requireAuth()`, `Auth::requireAdmin()`, `Auth::requireOwner()`）
- `../PlistParser.php` -- 快捷指令 plist 解析（仅在 shortcuts.php 中）
- `../Response.php` -- JSON 响应辅助（`Response::json()`, `Response::error()` 等）
- `firebase/php-jwt` -- Token 签发（仅在 users.php 中）

**依赖本模块的**:
- `../public/index.php` -- 路由分发调用各模块函数

## 规范

### 错误处理

所有路由使用 `Response` 类的统一错误响应方法：

```php
Response::error('参数不合法', 400);
Response::notFound();    // 404
Response::forbidden();   // 403
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

### 认证模式

- 每个路由处理函数内部调用 `Auth::requireAuth()` 获取当前用户
- 通过判断返回值的 `role` 字段控制管理员功能访问
- 不存在全局中间件概念，认证完全在函数内实现

### 参数校验

- 路由内部进行参数校验，无统一 validation 机制
- 字符串长度检查、正则校验、数据库唯一性检查
- `$_GET` 获取查询参数，`json_decode(file_get_contents('php://input'))` 获取 JSON 请求体

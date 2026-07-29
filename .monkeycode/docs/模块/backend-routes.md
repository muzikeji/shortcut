# backend/src/routes/

后端 API 路由层，负责处理 HTTP 请求并调用数据库操作。所有路由均挂载在 Express Router 上，通过 `backend/src/index.js` 注入到应用实例。

## 结构

```
routes/
├── user.js           # 用户管理：注册、登录、资料、密码、头像
├── shortcut.js       # 快捷指令管理：CRUD、列表、下架/恢复、下载
├── interact.js       # 互动：点赞 toggle、评论 CRUD
└── admin.js          # 管理员：用户管理（封禁/解封）、分享管理
```

## 关键文件

| 文件 | 目的 |
|------|------|
| `user.js` | 7 个端点：用户注册登录、资料维护、头像上传。密码 bcrypt 哈希，头像 multer 处理 |
| `shortcut.js` | 8 个端点：快捷指令 CRUD、列表（分页/搜索/排序）、下架/恢复、下载重定向 |
| `interact.js` | 4 个端点：点赞 toggle（UNIQUE 约束保证幂等）、评论的增删查 |
| `admin.js` | 4 个端点：用户列表、封禁/解封（级联下架分享）、分享管理列表 |

## 依赖

**本模块依赖**:
- `../database.js` -- 数据库连接和查询
- `../auth.js` -- 认证中间件（authRequired, authOptional, adminRequired）
- `jsonwebtoken`, `bcryptjs`, `multer`（仅在 user.js 中）

**依赖本模块的**:
- `../index.js` -- 将各路由文件挂载到 Express 实例

## 规范

### 错误处理

所有路由使用统一的错误响应格式：
```javascript
res.status(4xx|5xx).json({ error: '错误描述' });
```

服务器内部错误使用 `catch` 捕获，返回 500：
```javascript
try {
  // ...
} catch (err) {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
}
```

### 认证模式

- `router.use(authRequired)` -- 路由级应用，整组路由需要认证
- 单一端点应用在需要认证的特定路由上

### 参数校验

路由内部进行参数校验，无统一 validation middleware：
- 字符串长度检查（`if (username.length < 2)`）
- 正则校验（iCloud URL 格式）
- 数据库唯一性检查（用户名、邮箱、URL 去重）

# 接口文档

## 概述

后端提供 RESTful API，所有接口路径前缀为 `/api`。开发环境中前端通过 Vite 反向代理转发 `/api/*` 到后端 `localhost:3001`。

**认证方式**: Bearer Token (JWT HS256)，请求头 `Authorization: Bearer <token>`

**响应格式**: JSON，错误时返回 `{ "error": "错误描述" }`

---

## 用户接口 (`/api/users`)

### POST /api/users/register -- 用户注册

**认证**: 无

**请求体**:
```json
{
  "username": "string (2-20 字符, 必填)",
  "email": "string (有效邮箱, 必填)",
  "password": "string (6-100 字符, 必填)"
}
```

**响应** (201):
```json
{
  "user": { "id": 1, "username": "demo", "email": "demo@example.com", "avatar": "", "bio": "", "role": "user", "created_at": "2024-01-01T00:00:00.000Z" },
  "token": "jwt-token-string"
}
```

### POST /api/users/login -- 用户登录

**认证**: 无

**请求体**:
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**响应** (200): 格式同注册接口

**错误**: 账号或密码错误 (401), 账号已被封禁 (403)

### GET /api/users/me -- 获取当前用户信息

**认证**: authRequired

**响应** (200):
```json
{
  "user": { "id": 1, "username": "demo", "email": "demo@example.com", "avatar": "", "bio": "", "role": "user", "banned": 0, "created_at": "..." }
}
```

### GET /api/users/:id -- 获取指定用户公开信息

**认证**: 无

**响应** (200):
```json
{
  "user": { "id": 1, "username": "demo", "avatar": "", "bio": "", "created_at": "...", "shortcut_count": 5 }
}
```

### PUT /api/users/profile -- 更新个人资料

**认证**: authRequired

**请求体**:
```json
{
  "username": "string (2-20 字符, 可选)",
  "email": "string (有效邮箱, 可选)",
  "bio": "string (0-100 字符, 可选)"
}
```

**响应** (200): 返回更新后的 user 对象

### PUT /api/users/password -- 修改密码

**认证**: authRequired

**请求体**:
```json
{
  "currentPassword": "string (必填)",
  "newPassword": "string (6-100 字符, 必填)"
}
```

**响应** (200): `{ "message": "密码修改成功" }`

### POST /api/users/avatar -- 上传头像

**认证**: authRequired

**请求**: multipart/form-data，字段名 `avatar`，限制 2MB，支持 JPEG/PNG/GIF/WebP

**响应** (200):
```json
{
  "user": { "avatar": "/api/uploads/avatars/avatar-1-1234567890.jpeg", ... }
}
```

---

## 快捷指令接口 (`/api/shortcuts`)

### GET /api/shortcuts -- 获取快捷指令列表

**认证**: authOptional

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 12 | 每页数量 |
| `search` | string | -- | 搜索关键词（标题模糊匹配） |
| `sort` | string | `latest` | 排序: `latest`(最新), `popular`(最热), `downloads`(最多下载) |
| `userId` | number | -- | 筛选指定用户的快捷指令 |
| `includeRemoved` | boolean | false | 是否包含已下架的（仅作者本人可用） |

**响应** (200):
```json
{
  "shortcuts": [
    {
      "id": 1,
      "slug": "1785243074",
      "color": "#3871DE",
      "stats": "{\"actionCount\":134,\"size\":633651,\"permissions\":[\"打开应用\",\"文件\",\"照片\",\"通知\"],\"actionTypes\":[...]}",
      "title": "一键打开健康码",
      "description": "快速打开健康码页面",
      "category": "生活",
      "file_url": "https://www.icloud.com/shortcuts/abc123",
      "file_name": "",
      "file_size": 633651,
      "download_count": 42,
      "like_count": 15,
      "comment_count": 3,
      "user_id": 1,
      "username": "demo",
      "avatar": "/api/uploads/avatars/avatar-1-123.jpeg",
      "liked": false,
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```

### GET /api/shortcuts/:id -- 获取快捷指令详情

**认证**: authOptional

`id` 参数既可以是自增数字 ID，也可以是 10 位数字时间戳 slug。后端 `idParam()` 逻辑：纯数字参数先按 ID 查询，未命中再按 slug 查询。

**响应** (200): 返回单个 shortcut 对象（格式同列表项，不再包装）

### POST /api/shortcuts/fetch-name -- 预取快捷指令元数据

**认证**: 无

发布页粘贴链接后调用，抓取快捷指令的真实名称、主题色和统计信息。

**请求体**:
```json
{
  "url": "string (必填, iCloud 快捷指令链接)"
}
```

**响应** (200):
```json
{
  "name": "安心记加班非月底结算版",
  "color": "#3871DE",
  "stats": {
    "actionCount": 134,
    "size": 633651,
    "permissions": ["打开应用", "文件", "照片", "通知"]
  }
}
```

**错误**: 无效链接 (400), 无法获取名称 (404)

### POST /api/shortcuts -- 发布快捷指令

**认证**: authRequired

**请求体**:
```json
{
  "title": "string (必填)",
  "description": "string (可选)",
  "category": "string (可选, 默认 '其他')",
  "url": "string (必填, iCloud 快捷指令链接)",
  "slug": "string (可选, 10 位数字时间戳, 默认后端生成)",
  "color": "string (可选, #RRGGBB 主题色)"
}
```

iCloud URL 格式要求: `https://www.icloud.com/shortcuts/[a-zA-Z0-9]+`

发布时后端会再次调用 iCloud API 抓取元数据：**名称优先使用抓取到的真实名称**（前端传入的 title 作为兜底），color 优先使用前端传入值，否则用抓取值；同时下载 plist 解析统计信息写入 `file_size` 和 `stats` 字段。

**响应** (201):
```json
{
  "shortcut": { ... }
}
```

### PUT /api/shortcuts/:id -- 编辑快捷指令

**认证**: authRequired（作者本人或管理员）

**请求体**:
```json
{
  "title": "string (可选)",
  "description": "string (可选)",
  "category": "string (可选)"
}
```

**响应** (200): 返回更新后的 shortcut 对象

### DELETE /api/shortcuts/:id -- 删除快捷指令

**认证**: authRequired（仅作者本人）

**响应** (200): `{ "message": "快捷指令已删除" }`

### PUT /api/shortcuts/:id/remove -- 下架快捷指令

**认证**: authRequired（作者或管理员）

将快捷指令 `status` 设为 `removed`（软删除）。

**响应** (200): `{ "message": "快捷指令已下架" }`

### PUT /api/shortcuts/:id/restore -- 恢复快捷指令

**认证**: authRequired（作者或管理员）

将快捷指令 `status` 从 `removed` 恢复为 `active`。

**响应** (200): `{ "message": "快捷指令已恢复" }`

### GET /api/shortcuts/:id/download -- 下载快捷指令

**认证**: 无

将 `download_count` 加 1 后 302 重定向到 iCloud 快捷指令链接。`id` 支持数字 ID 或 slug。

### GET /api/shortcuts/:id/versions -- 获取版本历史

**认证**: 无

**响应** (200):
```json
{
  "versions": [
    {
      "id": 2,
      "shortcut_id": 1,
      "url": "https://www.icloud.com/shortcuts/def456",
      "version_note": "修复了崩溃问题",
      "created_at": "2024-01-02T00:00:00.000Z"
    },
    {
      "id": 1,
      "shortcut_id": 1,
      "url": "https://www.icloud.com/shortcuts/abc123",
      "version_note": "初始版本",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/shortcuts/:id/versions -- 更新版本

**认证**: authRequired（作者或管理员）

提交新的 iCloud 链接，插入版本记录并更新 `shortcuts.file_url`。

**请求体**:
```json
{
  "url": "string (必填, 新的 iCloud 链接)",
  "version_note": "string (可选, 更新说明)"
}
```

**响应** (200): 返回更新后的 versions 数组 + `{ "message": "版本更新成功" }`

### GET /api/shortcuts/:id/similar -- 相似推荐

**认证**: 无

返回同分类下按点赞数排序的前 5 条活跃快捷指令（排除自身）。

**响应** (200): `{ "shortcuts": [...] }`

---

## 互动接口 (`/api/shortcuts`)

### POST /api/shortcuts/:shortcutId/like -- 点赞/取消点赞

**认证**: authRequired

Toggle 模式：未点赞时点赞，已点赞时取消。同时更新 shortcuts 表的 `like_count`。

**响应** (200):
```json
{
  "liked": true,
  "like_count": 16
}
```

### GET /api/shortcuts/:shortcutId/comments -- 获取评论列表

**认证**: authOptional

**响应** (200):
```json
{
  "comments": [
    {
      "id": 1,
      "shortcut_id": 1,
      "user_id": 2,
      "username": "other_user",
      "avatar": "",
      "content": "很好用！",
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### POST /api/shortcuts/:shortcutId/comments -- 发表评论

**认证**: authRequired

**请求体**:
```json
{
  "content": "string (必填, 1-500 字符)"
}
```

**响应** (201): 返回新创建的 comment 对象

### DELETE /api/shortcuts/:shortcutId/comments/:commentId -- 删除评论

**认证**: authRequired（仅评论作者本人）

**响应** (200): `{ "message": "评论已删除" }`

---

## 管理接口 (`/api/admin`) -- 全部需要管理员权限

### GET /api/admin/users -- 用户列表

**认证**: adminRequired

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |

**响应** (200):
```json
{
  "users": [
    {
      "id": 1,
      "username": "demo",
      "email": "demo@example.com",
      "avatar": "",
      "bio": "",
      "role": "user",
      "banned": 0,
      "shortcut_count": 5,
      "created_at": "..."
    }
  ],
  "total": 20,
  "page": 1,
  "totalPages": 2
}
```

### PUT /api/admin/users/:id/ban -- 封禁用户

**认证**: adminRequired

封禁用户并将该用户所有快捷指令批量设为 `status='removed'`。管理员不可被封禁。

**响应** (200): `{ "message": "用户已封禁" }`

### PUT /api/admin/users/:id/unban -- 解封用户

**认证**: adminRequired

**响应** (200): `{ "message": "用户已解封" }`

### GET /api/admin/shortcuts -- 快捷指令管理列表

**认证**: adminRequired

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `status` | string | `all` | 筛选: `all`, `active`, `removed` |

**响应** (200): 返回 shortcuts 数组和分页信息（格式同 `GET /api/shortcuts`）

---

## 认证 Token 说明

- **算法**: HS256
- **Payload**: `{ "id": <user_id>, "username": "<username>" }`
- **有效期**: 7 天
- **签发**: 注册或登录成功后返回
- **校验**: `authRequired` / `authOptional` 中间件从 `Authorization: Bearer <token>` 请求头读取，验证签名并附加 `req.user` 对象（含 id, username, role, banned 等最新数据库字段）

## 错误码约定

| HTTP 状态码 | 含义 |
|-------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 无效 |
| 403 | 无权限（被封禁/非管理员） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复 URL） |
| 500 | 服务器内部错误 |

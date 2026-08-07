# 接口文档

## 概述

后端提供 RESTful API，所有接口路径前缀为 `/api`。开发环境中前端通过 Vite 反向代理转发 `/api/*` 到后端 `localhost:8080`。

**认证方式**: Bearer Token (JWT HS256)，请求头 `Authorization: Bearer <token>`。Token 有效期 30 天。

**响应格式**: JSON，错误时返回 `{ "error": "错误描述" }`。HTTP 状态码遵循标准（200/201/400/401/403/404/409/500）。

**角色体系**: `user`（普通用户）< `admin`（管理员）< `owner`（站长）。接口标注所需最低角色。

---

## 用户接口 (`/api/users`)

### POST /api/users/register -- 用户注册

**认证**: 无

**请求体**:
```json
{
  "username": "string (2-20 字符, 必填)",
  "email": "string (有效邮箱, 必填)",
  "password": "string (6+ 字符, 必填)"
}
```

**响应** (201):
```json
{
  "user": { "id": 1, "username": "demo", "email": "demo@example.com", "avatar": "", "bio": "", "role": "user", "banned": 0, "created_at": "..." },
  "token": "jwt-token-string"
}
```

**错误**: 用户名/邮箱已存在 (409), 参数格式不合法 (400)

### POST /api/users/login -- 用户登录

**认证**: 无。频率限制：每 IP 15 分钟内最多 5 次尝试。

**请求体**:
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**响应** (200): 格式同注册接口，返回 `{user, token}`

**错误**: 账号或密码错误 (401), 账号已被封禁 (403)

### GET /api/users/me -- 获取当前用户信息

**认证**: requireAuth

**响应** (200): `{ "user": { id, username, email, avatar, bio, role, banned, created_at } }`

### GET /api/users/{id} -- 获取指定用户公开信息

**认证**: 无

**响应** (200):
```json
{
  "user": { "id": 1, "username": "demo", "avatar": "", "bio": "", "created_at": "...", "shortcut_count": 5 }
}
```

### PUT /api/users/profile -- 更新个人资料

**认证**: requireAuth

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

**认证**: requireAuth

**请求体**:
```json
{
  "currentPassword": "string (必填)",
  "newPassword": "string (6+ 字符, 必填)"
}
```

**响应** (200): `{ "message": "密码修改成功" }`

### POST /api/users/avatar -- 上传头像

**认证**: requireAuth

**请求**: multipart/form-data，字段名 `avatar`，限制 2MB，支持格式 jpg/png/gif

**响应** (200): `{ "user": { "avatar": "/api/uploads/1_1234567890.jpg", ... } }`

---

## 认证别名接口 (`/api/auth`)

向后兼容旧版前端路由。

### POST /api/auth/register

等同于 `POST /api/users/register`

### POST /api/auth/login

等同于 `POST /api/users/login`

### GET /api/auth/me

等同于 `GET /api/users/me`，需要 requireAuth。

---

## 快捷指令接口 (`/api/shortcuts`)

### GET /api/shortcuts -- 获取快捷指令列表

**认证**: optionalAuth（已登录时返回 liked 状态）

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | 1 | 页码 |
| `limit` | int | 12（最大 100） | 每页数量 |
| `search` | string | -- | 搜索关键词（标题模糊匹配） |
| `sort` | string | `latest` | 排序: `latest`, `likes`, `downloads` |
| `userId` | int | -- | 筛选指定用户的快捷指令 |
| `includeRemoved` | bool | false | 是否包含已下架的（用户自己的列表可用） |
| `status` | string | `active` | 快捷指令状态筛选 |

默认过滤：仅 `status='active'` 且发布者未被封禁的快捷指令。

**响应** (200):
```json
{
  "shortcuts": [
    {
      "id": 1,
      "slug": "1785243074",
      "title": "一键打开健康宝",
      "description": "快速打开健康宝页面",
      "category": "生活",
      "file_url": "https://www.icloud.com/shortcuts/abc123",
      "file_size": 633651,
      "download_count": 42,
      "like_count": 15,
      "comment_count": 3,
      "user_id": 1,
      "username": "demo",
      "avatar": "/api/uploads/1_xxx.jpg",
      "color": "#3871DE",
      "stats": "{\"actionCount\":134,\"size\":633651,\"permissions\":[\"打开应用\",\"文件\",\"照片\",\"通知\"]}",
      "status": "active",
      "liked": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "totalPages": 5
}
```

### GET /api/shortcuts/{id} -- 获取快捷指令详情

**认证**: optionalAuth

`id` 参数既可以是自增数字 ID，也可以是 10 位数字时间戳 slug。后端优先按 ID 查询，未命中再按 slug 查询。

**响应** (200): 返回单个 shortcut 对象及 liked 状态

### POST /api/shortcuts/fetch-name -- 预取快捷指令元数据

**认证**: requireAuth

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
  "name": "安心记加班",
  "color": "#3871DE",
  "stats": {
    "actionCount": 134,
    "size": 633651,
    "permissions": ["打开应用", "文件", "照片", "通知"]
  }
}
```

**错误**: 无效链接 (400), 无法获取元数据 (404)

### POST /api/shortcuts -- 发布快捷指令

**认证**: requireAuth

**请求体**:
```json
{
  "title": "string (必填)",
  "description": "string (可选)",
  "category": "string (可选, 默认'其他')",
  "url": "string (必填, iCloud 快捷指令链接)",
  "slug": "string (可选, 10 位数字时间戳, 默认后端生成)",
  "color": "string (可选, #RRGGBB 主题色)"
}
```

iCloud URL 格式要求: `https://www.icloud.com/shortcuts/[a-z0-9]+`

发布逻辑：
- 管理员发布 → status='active'（跳过审核）
- 普通用户发布 → status='pending'（待审核）
- 后端自动调用 iCloud API 抓取元数据并解析 plist 获取统计信息
- 若配置了企业微信机器人，自动发送审核通知

**响应** (201): `{ "shortcut": { ... } }`

### PUT/PATCH /api/shortcuts/{id} -- 编辑快捷指令

**认证**: requireAuth（作者本人或管理员）

**请求体**:
```json
{
  "title": "string (可选)",
  "description": "string (可选)",
  "category": "string (可选)"
}
```

修改非活跃状态的快捷指令会自动重置为 pending 状态并发送企微通知。

**响应** (200): 返回更新后的 shortcut 对象

### DELETE /api/shortcuts/{id} -- 删除快捷指令

**认证**: requireAuth（仅作者本人）

硬删除，级联删除关联的 likes、comments、versions。

**响应** (200): `{ "message": "快捷指令已删除" }`

### PUT /api/shortcuts/{id}/remove -- 下架快捷指令

**认证**: requireAuth（作者或管理员）

将快捷指令 `status` 设为 `removed`（软删除，可恢复）。

**响应** (200): `{ "message": "操作成功" }`

### PUT /api/shortcuts/{id}/restore -- 恢复快捷指令

**认证**: requireAuth（作者或管理员）

将快捷指令 `status` 从 `removed` 恢复为 `active`。

**响应** (200): `{ "message": "操作成功" }`

### GET /api/shortcuts/{id}/download -- 下载快捷指令

**认证**: 无

将 `download_count` 加 1 后 302 重定向到 iCloud 快捷指令链接。`id` 支持数字 ID 或 slug。

### POST /api/shortcuts/{id}/refresh -- 刷新统计信息

别名: `/refresh-stats`

**认证**: requireAuth

从 iCloud 重新抓取元数据并解析 plist，更新 stats JSON 字段。

### GET /api/shortcuts/{id}/versions -- 获取版本历史

**认证**: 无

**响应** (200):
```json
{
  "versions": [
    { "id": 2, "shortcut_id": 1, "url": "https://...", "version_note": "修复崩溃", "created_at": "..." },
    { "id": 1, "shortcut_id": 1, "url": "https://...", "version_note": "初始版本", "created_at": "..." }
  ]
}
```

### POST /api/shortcuts/{id}/versions -- 添加新版本

**认证**: requireAuth（作者或管理员）

提交新的 iCloud 链接，插入版本记录并更新 `shortcuts.file_url`。

**请求体**:
```json
{
  "url": "string (必填, 新的 iCloud 链接)",
  "version_note": "string (可选)"
}
```

**响应** (200): 返回更新后的 versions 列表

### GET /api/shortcuts/{id}/similar -- 相似推荐

**认证**: 无

返回同分类下最多 5 条活跃快捷指令（排除自身），按下载量排序。

**响应** (200): `{ "shortcuts": [...] }`

---

## 互动接口

### POST /api/shortcuts/{id}/like -- 点赞/取消点赞

**认证**: requireAuth

Toggle 模式：未点赞时点赞，已点赞时取消。同时更新 `like_count`。

**响应** (200):
```json
{
  "liked": true,
  "like_count": 16
}
```

### GET /api/shortcuts/{id}/comments -- 获取评论列表

**认证**: 无

**查询参数**: `sort` -- `newest`（默认）/ `popular`

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
      "content": "很好用",
      "parent_id": null,
      "created_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### POST /api/shortcuts/{id}/comments -- 发表评论

**认证**: requireAuth

**请求体**:
```json
{
  "content": "string (必填, 1-500 字符, HTML 标签会被 strip)",
  "parent_id": "int (可选, 回复某条评论)"
}
```

**响应** (201): 返回新创建的 comment 对象

### DELETE /api/shortcuts/{id}/comments/{commentId} -- 删除评论

**认证**: requireAuth（评论作者或管理员）

级联删除评论及其所有子回复。同时减少 `comment_count`。

**响应** (200): `{ "message": "评论已删除" }`

### 向后兼容别名 (`/api/interact`)

| 方法 | 路径 | 等价于 |
|------|------|--------|
| POST | `/api/interact/{id}/like` | `POST /api/shortcuts/{id}/like` |
| GET | `/api/interact/{id}/comments` | `GET /api/shortcuts/{id}/comments` |
| POST | `/api/interact/{id}/comments` | `POST /api/shortcuts/{id}/comments` |
| DELETE | `/api/interact/comments/{id}` | `DELETE /api/shortcuts/{id}/comments/{commentId}` |

---

## 管理接口 (`/api/admin`)

### GET /api/admin/dashboard -- 仪表盘

**认证**: requireAdmin（admin 或 owner）

**响应** (200):
```json
{
  "users": 120,
  "shortcuts": 350,
  "comments": 1200,
  "likes": 5000,
  "downloads": 20000
}
```

### GET /api/admin/users -- 用户列表

**认证**: requireAdmin

**查询参数**: `page`（默认 1）, `search`（按 username/email 搜索）

**响应** (200): `{ "users": [...], "total": ..., "totalPages": ... }`

### POST /api/admin/users -- 管理员创建用户

**认证**: requireOwner

**请求体**:
```json
{
  "username": "string (2-20 字符, 必填)",
  "email": "string (有效邮箱, 必填)",
  "password": "string (6+ 字符, 必填)"
}
```

**响应** (201): `{ "user": { ... }, "message": "用户创建成功" }`

### PUT /api/admin/users/{id}/role -- 修改用户角色

**认证**: requireOwner

**请求体**:
```json
{
  "role": "string (user / admin / owner)"
}
```

不允许修改自己的角色。

### PUT /api/admin/users/{id}/ban -- 封禁用户

**认证**: requireAdmin

保护 admin 和 owner 角色不可被封禁。封禁时用户所有活跃快捷指令自动设为 removed。

**响应** (200): `{ "message": "用户已封禁" }`

### PUT /api/admin/users/{id}/unban -- 解封用户

**认证**: requireAdmin

保护 admin 和 owner 角色不可被解封（他们本不应被封禁）。

**响应** (200): `{ "message": "用户已解封" }`

### GET /api/admin/shortcuts -- 快捷指令管理列表

**认证**: requireAdmin

**查询参数**: `page`, `search`（按标题/用户名）, `status`（筛选状态）

### DELETE /api/admin/shortcuts/{id} -- 管理员删除快捷指令

**认证**: requireAdmin

硬删除，级联删除关联数据。

### GET /api/admin/shortcuts/pending -- 待审核快捷指令

**认证**: requireAdmin

### PUT /api/admin/shortcuts/{id}/approve -- 通过审核

**认证**: requireAdmin

将 status 从 pending 改为 active。

### PUT /api/admin/shortcuts/{id}/reject -- 拒绝审核

**认证**: requireAdmin

将 status 从 pending 改为 removed。

---

## 设置接口 (`/api/settings`)

### GET /api/settings -- 获取公开设置

**认证**: 无

返回所有设置项，但 `wechatBotToken` 字段被移除。

### GET /api/admin/settings -- 获取完整设置（含 wechatBotToken）

**认证**: requireOwner

### PUT /api/settings -- 更新设置

**认证**: requireOwner

支持单键更新和批量更新两种模式。

**单键更新**:
```json
{
  "key": "site_name",
  "value": "捷径社区"
}
```

**批量更新**（使用 camelCase 前端映射）:
```json
{
  "siteName": "捷径社区",
  "seoDescription": "iOS 快捷指令分享平台"
}
```

设置键：`site_name`, `site_logo`, `icp_number`, `seo_title`, `seo_description`, `wechat_bot_token`

---

## 升级接口 (`/api/update`)

### GET /api/update/check -- 检查更新

**认证**: requireOwner

对比本地 `VERSION` 文件与 GitHub Releases（`muzikeji/shortcut-community-php`）的最新版本。

### POST /api/update/run -- 执行升级

**认证**: requireOwner

两阶段执行：
- `stage=download` -- 从 GitHub 下载 zip 到 data/.tmp_update/
- `stage=install` -- 备份 data/uploads/.env → 提取 zip → 部署文件 → 恢复数据

需要 `ZipArchive` PHP 扩展。

---

## 版本接口 (`/api/version`)

### GET /api/version -- 获取系统版本

**认证**: 无

**响应** (200):
```json
{
  "version": "1.3.2",
  "php": "8.2.0",
  "zipAvailable": true
}
```

---

## 认证 Token 说明

- **算法**: HS256
- **Payload**: `{ "id": <user_id>, "username": "<username>", "role": "<user|admin|owner>", "iat": <timestamp>, "exp": <timestamp> }`
- **有效期**: 30 天
- **签发**: 注册或登录成功后返回
- **校验**: 从 `Authorization: Bearer <token>` 请求头读取，`Auth::requireAuth()` 验证签名并返回用户数组

## 错误码约定

| HTTP 状态码 | 含义 |
|-------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 无效 |
| 403 | 无权限（被封禁/角色不足） |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复 URL/用户名） |
| 500 | 服务器内部错误 |

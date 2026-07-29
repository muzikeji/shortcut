# 用户 (User)

代表平台的注册用户，拥有身份标识、角色权限和封禁状态。

## 什么是用户？

每个用户可以发布快捷指令、点赞、评论、编辑个人资料和上传头像。角色分为普通用户（`user`）和管理员（`admin`），管理员拥有封禁用户和管理分享的权限。

**关键特征**:
- 密码使用 bcrypt 哈希存储
- 头像通过 multer 上传到本地文件系统
- 封禁用户时自动下架其所有快捷指令
- 管理员不可被封禁

## 代码位置

| 方面 | 位置 |
|------|------|
| 数据库表 | `users` 表 |
| 后端路由 | `backend/src/routes/user.js` |
| 管理路由 | `backend/src/routes/admin.js` |
| 前端认证 | `frontend/src/AuthContext.tsx` |
| 前端个人主页 | `frontend/src/pages/UserProfile.tsx` |
| 类型定义 | `frontend/src/pages/types.ts` (`AdminUser` interface) |

## 结构

```typescript
interface User {
  id: number;             // 自增主键
  username: string;       // 用户名（2-20 字符，唯一）
  email: string;          // 邮箱（唯一）
  password: string;       // bcrypt 哈希
  avatar: string;         // 头像 URL（本地路径或空字符串）
  bio: string;            // 个性签名（0-100 字符）
  role: 'user' | 'admin'; // 角色
  banned: 0 | 1;          // 封禁标记
  created_at: string;     // 注册时间
}
```

### 关键字段

| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| `username` | `string` | 用户名 | 唯一，2-20 字符 |
| `email` | `string` | 邮箱 | 唯一，需符合邮箱格式 |
| `password` | `string` | 密码哈希 | bcrypt，不存储明文 |
| `role` | `enum` | 角色 | `user` 或 `admin`，默认 `user` |
| `banned` | `0` 或 `1` | 封禁标记 | 默认 `0`（未封禁） |

## 不变量

1. **管理员不可被封禁**: 封禁操作前检查角色，不可封禁 `role='admin'` 的用户
2. **用户名和邮箱唯一**: 数据库 UNIQUE 约束保证
3. **封禁级联**: 封禁用户时该用户所有 `status='active'` 的快捷指令自动设为 `removed`

## 生命周期

```mermaid
stateDiagram-v2
    [*] --> Active: register()
    Active --> Banned: admin ban
    Banned --> Active: admin unban
    Active --> [*]: (无删除功能)
    Banned --> [*]: (无删除功能)
```

### 状态描述

| 状态 | 描述 | 影响 |
|------|------|------|
| 正常 (`banned=0`) | 可正常使用全部功能 | 登录、发布、点赞、评论 |
| 封禁 (`banned=1`) | 无法登录 | 所有快捷指令同时下架 |

## 关系

```mermaid
erDiagram
    USER ||--o{ SHORTCUT : "发布"
    USER ||--o{ LIKE : "点赞"
    USER ||--o{ COMMENT : "发表评论"
```

| 关联概念 | 关系 | 描述 |
|---------|------|------|
| Shortcut | 发布 | 一个 User 可发布多个快捷指令 |
| Like | 点赞 | 一个 User 可对多个快捷指令点赞 |
| Comment | 评论 | 一个 User 可发表多条评论 |

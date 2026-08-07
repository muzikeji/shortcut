# php-shortcut/src/Auth.php

JWT 认证模块，提供 Token 签发和三级角色权限校验。

## 关键文件

| 文件 | 目的 |
|------|------|
| `Auth.php` | 静态方法类，包含 `generateToken()`, `requireAuth()`, `requireAdmin()`, `requireOwner()` |

## 类方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `setSecret()` | `(string $secret): void` | 设置 JWT 签名密钥（从 .env 加载） |
| `generateToken()` | `(array $user): string` | 签发 JWT（payload: `{id, username, role, iat, exp}`，有效期 30 天，HS256） |
| `verifyToken()` | `(string $token): ?array` | 解码并验证 JWT，返回 payload 数组或 null |
| `getTokenFromHeader()` | `(): ?string` | 从 `Authorization: Bearer <token>` 请求头提取 Token |
| `requireAuth()` | `(): ?array` | 强制认证，校验 Bearer Token，返回用户数组或 null |
| `optionalAuth()` | `(): ?array` | 可选认证（别名，与 requireAuth 相同） |
| `requireAdmin()` | `(): ?array` | 管理员权限检查：要求 role 为 `admin` 或 `owner` |
| `requireOwner()` | `(): ?array` | 站长权限检查：要求 role 为 `owner` |

## 认证流程

```mermaid
sequenceDiagram
    participant Client
    participant Route as 路由处理函数
    participant Auth as Auth.php
    participant JWT as firebase/php-jwt
    participant DB as SQLite/MySQL

    Client->>Route: Authorization: Bearer &lt;token&gt;
    Route->>Auth: requireAuth()
    Auth->>Auth: getTokenFromHeader()
    Auth->>JWT: JWT::decode(token, secret, HS256)
    alt 有效
        JWT-->>Auth: { id, username, role }
        Auth->>DB: SELECT FROM users WHERE id=?
        DB-->>Auth: user record
        alt banned=1
            Auth-->>Route: null (封禁用户)
        else
            Auth-->>Route: { id, username, role, ... }
        end
    else 无效或过期
        JWT-->>Auth: exception
        Auth-->>Route: null
    end
    alt user 为 null
        Route-->>Client: 401 "请先登录"
    else role 不足
        Route-->>Client: 403 "无权访问"
    end
```

## 角色层级

| 角色 | 常量值 | 说明 |
|------|--------|------|
| owner | `owner` | 站长，拥有全部权限 |
| admin | `admin` | 管理员，可审核/封禁 |
| user | `user` | 普通用户，默认角色 |

权限矩阵：

| 操作 | user | admin | owner |
|------|------|-------|-------|
| 发布快捷指令 | 是 | 是 | 是 |
| 审核内容 | - | 是 | 是 |
| 封禁用户 | - | 是 | 是 |
| 管理用户角色 | - | - | 是 |
| 站点设置 | - | - | 是 |
| 系统升级 | - | - | 是 |

## 依赖

**本模块依赖**:
- `firebase/php-jwt` -- Token 签发和校验
- PDO 连接 -- 查询用户最新状态（含封禁检查）

**依赖本模块的**:
- 所有路由文件 -- 通过 `Auth::requireAuth()` / `Auth::requireAdmin()` / `Auth::requireOwner()` 保护端点
- `routes/users.php` -- 登录/注册时使用 `Auth::generateToken()` 签发 Token

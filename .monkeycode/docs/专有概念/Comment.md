# 评论 (Comment)

用户对快捷指令发表的文字评论，支持嵌套回复。

## 什么是评论？

用户在快捷指令详情页发表文字评论，其他用户可以查看和回复。支持嵌套回复（通过 `parent_id` 字段实现一级回复层级）。评论作者可以删除自己的评论，管理员也可以删除。已下架的快捷指令不允许新增评论。

**关键特征**:
- 评论内容 1-500 字符，HTML 标签会被 `strip_tags` 去除
- 支持嵌套回复：通过 `parent_id` 引用父评论
- 仅作者或管理员可删除
- 删除评论时级联删除所有子回复
- 评论数 `comment_count` 手动维护在 shortcuts 表中
- 已下架（`removed`）的快捷指令仍可查看已有评论但不可新增

## 代码位置

| 方面 | 位置 |
|------|------|
| 数据库表 | `comments` 表 |
| 后端路由 | `php-shortcut/src/routes/interact.php` |
| 前端调用 | `frontend/src/api.ts` (`api.getComments`, `api.addComment`, `api.deleteComment`) |
| 前端组件 | `frontend/src/components/shortcut/CommentSection.tsx` |
| 前端页面 | `frontend/src/pages/ShortcutDetail.tsx` |

## 结构

```typescript
interface Comment {
  id: number;           // 自增主键
  shortcut_id: number;  // 所属快捷指令 ID (FK → shortcuts)
  user_id: number;      // 评论者 ID (FK → users)
  username: string;     // 评论者用户名（JOIN 结果）
  avatar: string;       // 评论者头像（JOIN 结果）
  content: string;      // 评论内容（1-500 字符）
  parent_id: number | null; // 父评论 ID (FK → comments, null 为顶层评论)
  created_at: string;   // 发表时间
}
```

### 关键字段

| 字段 | 类型 | 描述 | 约束 |
|------|------|------|------|
| `content` | `string` | 评论内容 | 必填，1-500 字符，HTML 标签被 strip |
| `shortcut_id` | `number` | 所属快捷指令 | 外键 |
| `user_id` | `number` | 评论者 | 外键，关联 users 表 |
| `parent_id` | `number \| null` | 父评论 | 外键，自引用，null 表示顶层评论 |

## 不变量

1. **仅作者或管理员可删除**: 删除操作检查 `user_id` 或调用者角色
2. **已下架不可新增**: 快捷指令 `status='removed'` 或 `status='pending'` 时禁止新增评论
3. **计数一致性**: `shortcuts.comment_count` 必须等于 `SELECT COUNT(*) FROM comments WHERE shortcut_id=?`
4. **级联删除**: 删除评论时，以该评论为 `parent_id` 的所有子回复一并删除，`comment_count` 相应减少
5. **父评论验证**: 如果提供 `parent_id`，必须确认该评论存在且属于同一快捷指令

## 生命周期

```mermaid
stateDiagram-v2
    [*] --> Created: POST /comments (发表)
    Created --> Deleted: DELETE /comments/:id (作者/管理员删除)
    Deleted --> [*]

    state Created {
        [*] --> TopLevel: parent_id = null
        [*] --> Reply: parent_id = 某评论 ID
    }
```

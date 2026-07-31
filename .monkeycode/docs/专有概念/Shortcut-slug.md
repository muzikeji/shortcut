# 快捷指令 slug

快捷指令的固定唯一标识符，用于生成永久不变的作品地址。

## 什么是 slug？

每个快捷指令在发布页生成时即分配一个 10 位纯数字标识符，格式为秒级 Unix 时间戳（`Math.floor(Date.now()/1000)`）。作品地址为 `{origin}/shortcut/{slug}`，后续版本更新不会改变该地址。

## 为什么用时间戳？

- **固定不变**：进入发布页即生成并固定，注释卡里的作品地址是真实可提前复制、后续一直有效的链接
- **纯数字**：规避 URL 中字母编码歧义，用户可直接在 iOS 快捷指令注释中粘贴
- **秒级唯一**：同一秒内并发发布时，后端检测冲突并返回错误，前端自动重新生成重试

## 生成与校验

**前端** (`Share.tsx`):
```typescript
function generateSlug() {
  return String(Math.floor(Date.now() / 1000));
}
```

**后端** (`shortcut.js`):
```javascript
// 创建时接受前端 slug，也可自行生成
const finalSlug = slug || generateSlug();
if (!/^[a-z0-9]+$/i.test(finalSlug)) {
  return res.status(400).json({ error: '无效的快捷指令标识' });
}
const slugExists = db.prepare('SELECT id FROM shortcuts WHERE slug = ?').get(finalSlug);
if (slugExists) {
  return res.status(400).json({ error: '该快捷指令标识已被使用，请重试' });
}
```

## 路由解析兼容

`shortcuts` 表同时存在自增数字 `id` 和数字 `slug`，两者在 URL 中形式相同。`idParam()` 统一处理：

```javascript
function idParam(db, value) {
  const numeric = /^\d+$/.test(value);
  if (numeric) {
    const byId = db.prepare('SELECT * FROM shortcuts WHERE id = ?').get(parseInt(value));
    if (byId) return byId;
  }
  return db.prepare('SELECT * FROM shortcuts WHERE slug = ?').get(value);
}
```

纯数字参数先按自增 ID 查询，未命中再按 slug 查询，因此旧版数字 ID 链接（如 `/shortcut/1`）依然可用。

## 数据迁移

旧数据（`slug` 列为空）在数据库初始化时回填 `created_at` 时间戳 + 4 位随机数。新建记录始终使用纯 10 位时间戳。

## 相关文件

| 文件 | 用途 |
|------|------|
| `backend/src/routes/shortcut.js` | `generateSlug()` / `idParam()` / 创建接口校验 |
| `backend/src/database.js` | `slug` 列 + 唯一索引 + 旧数据回填 |
| `frontend/src/pages/Share.tsx` | 进入页面生成 slug、冲突重试、跳转 |
| `frontend/src/pages/Home.tsx` / `ShortcutDetail.tsx` | 使用 `shortcut.slug` 拼接详情页链接 |

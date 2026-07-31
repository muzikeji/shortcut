const express = require('express');
const { getDb } = require('../database');
const { authRequired, authOptional } = require('../auth');

const router = express.Router();

const ICLOUD_SHORTCUT_REGEX = /^https?:\/\/(www\.)?icloud\.com\/shortcuts\/[a-zA-Z0-9]+$/i;

function isValidShortcutUrl(url) {
  return ICLOUD_SHORTCUT_REGEX.test(url);
}

function generateSlug() {
  return String(Math.floor(Date.now() / 1000));
}

function idParam(db, value) {
  const numeric = /^\d+$/.test(value);
  if (numeric) {
    const byId = db.prepare('SELECT * FROM shortcuts WHERE id = ?').get(parseInt(value));
    if (byId) return byId;
  }
  return db.prepare('SELECT * FROM shortcuts WHERE slug = ?').get(value);
}

router.get('/', authOptional, (req, res) => {
  const { search, sort, userId, page = 1, limit = 20, includeRemoved } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (!includeRemoved) {
    conditions.push("s.status = 'active'");
    conditions.push('(u.banned IS NULL OR u.banned = 0)');
  }

  if (search) {
    conditions.push('(s.title LIKE ? OR s.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (userId) {
    conditions.push('s.user_id = ?');
    params.push(parseInt(userId));
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countSql = `SELECT COUNT(*) as total FROM shortcuts s LEFT JOIN users u ON s.user_id = u.id ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  let orderBy = 'ORDER BY s.created_at DESC';
  if (sort === 'likes') orderBy = 'ORDER BY s.like_count DESC';
  if (sort === 'downloads') orderBy = 'ORDER BY s.download_count DESC';

  const sql = `
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    ${where}
    ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const shortcuts = db.prepare(sql).all(...params, parseInt(limit), offset);

  let likedIds = [];
  if (req.user) {
    const ids = shortcuts.map(s => s.id);
    if (ids.length > 0) {
      likedIds = db.prepare(
        `SELECT shortcut_id FROM likes WHERE user_id = ? AND shortcut_id IN (${ids.join(',')})`
      ).all(req.user.id).map(r => r.shortcut_id);
    }
  }

  const result = shortcuts.map(s => ({
    ...s,
    liked: likedIds.includes(s.id)
  }));

  res.json({
    shortcuts: result,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

router.get('/:id', authOptional, (req, res) => {
  const db = getDb();
  const target = idParam(db, req.params.id);

  if (!target) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  const shortcut = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(target.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  let liked = false;
  if (req.user) {
    const like = db.prepare('SELECT id FROM likes WHERE shortcut_id = ? AND user_id = ?')
      .get(shortcut.id, req.user.id);
    liked = !!like;
  }

  res.json({ shortcut: { ...shortcut, liked } });
});

router.post('/', authRequired, (req, res) => {
  const { title, description, category, url, slug } = req.body;

  if (!title) {
    return res.status(400).json({ error: '请输入快捷指令名称' });
  }
  if (!url) {
    return res.status(400).json({ error: '请提供快捷指令链接' });
  }
  if (!isValidShortcutUrl(url)) {
    return res.status(400).json({ error: '请输入有效的 iCloud 快捷指令链接 (https://www.icloud.com/shortcuts/xxx)' });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM shortcuts WHERE file_url = ?').get(url);
  if (existing) {
    return res.status(400).json({ error: '该快捷指令已被分享' });
  }

  const finalSlug = slug || generateSlug();
  if (!/^[a-z0-9]+$/i.test(finalSlug)) {
    return res.status(400).json({ error: '无效的快捷指令标识' });
  }
  const slugExists = db.prepare('SELECT id FROM shortcuts WHERE slug = ?').get(finalSlug);
  if (slugExists) {
    return res.status(400).json({ error: '该快捷指令标识已被使用，请重试' });
  }

  const result = db.prepare(`
    INSERT INTO shortcuts (slug, title, description, category, file_url, file_name, file_size, user_id)
    VALUES (?, ?, ?, ?, ?, '', 0, ?)
  `).run(
    finalSlug,
    title,
    description || '',
    category || '其他',
    url,
    req.user.id
  );

  db.prepare('INSERT INTO shortcut_versions (shortcut_id, url, version_note) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, url, '初始版本');

  const shortcut = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(result.lastInsertRowid);

  res.json({ shortcut });
});

router.put('/:id', authRequired, (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权编辑该快捷指令' });
  }

  const { title, description, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: '请输入快捷指令名称' });
  }

  const updates = [];
  const params = [];

  updates.push('title = ?');
  params.push(title);

  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category);
  }

  params.push(shortcut.id);
  db.prepare(`UPDATE shortcuts SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(shortcut.id);

  res.json({ shortcut: updated });
});

router.delete('/:id', authRequired, (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己分享的快捷指令' });
  }

  db.prepare('DELETE FROM shortcuts WHERE id = ?').run(shortcut.id);
  res.json({ message: '删除成功' });
});

router.put('/:id/remove', authRequired, (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权下架该快捷指令' });
  }

  db.prepare("UPDATE shortcuts SET status = 'removed' WHERE id = ?").run(shortcut.id);
  res.json({ message: '下架成功' });
});

router.put('/:id/restore', authRequired, (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权恢复该快捷指令' });
  }

  db.prepare("UPDATE shortcuts SET status = 'active' WHERE id = ?").run(shortcut.id);
  res.json({ message: '恢复成功' });
});

router.get('/:id/versions', (req, res) => {
  const db = getDb();
  const target = idParam(db, req.params.id);

  if (!target) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  const versions = db.prepare(`
    SELECT id, shortcut_id, url, version_note, created_at
    FROM shortcut_versions
    WHERE shortcut_id = ?
    ORDER BY created_at DESC
  `).all(target.id);

  res.json({ versions });
});

router.post('/:id/versions', authRequired, (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权更新该快捷指令' });
  }

  const { url, version_note } = req.body;
  if (!url) {
    return res.status(400).json({ error: '请提供新的快捷指令链接' });
  }
  if (!isValidShortcutUrl(url)) {
    return res.status(400).json({ error: '请输入有效的 iCloud 快捷指令链接' });
  }

  db.prepare('INSERT INTO shortcut_versions (shortcut_id, url, version_note) VALUES (?, ?, ?)')
    .run(shortcut.id, url, version_note || '');

  db.prepare('UPDATE shortcuts SET file_url = ? WHERE id = ?')
    .run(url, shortcut.id);

  const versions = db.prepare(`
    SELECT id, shortcut_id, url, version_note, created_at
    FROM shortcut_versions
    WHERE shortcut_id = ?
    ORDER BY created_at DESC
  `).all(shortcut.id);

  res.json({ versions, message: '版本更新成功' });
});

router.get('/:id/similar', (req, res) => {
  const db = getDb();
  const target = idParam(db, req.params.id);

  if (!target) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  const similar = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.category = ? AND s.id != ? AND s.status = 'active' AND (u.banned IS NULL OR u.banned = 0)
    ORDER BY s.like_count DESC, s.created_at DESC
    LIMIT 5
  `).all(target.category, target.id);

  res.json({ shortcuts: similar });
});

router.get('/:id/download', (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  db.prepare('UPDATE shortcuts SET download_count = download_count + 1 WHERE id = ?').run(shortcut.id);

  res.redirect(shortcut.file_url);
});

module.exports = router;

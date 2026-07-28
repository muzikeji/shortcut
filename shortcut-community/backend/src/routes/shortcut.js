const express = require('express');
const { getDb } = require('../database');
const { authRequired, authOptional } = require('../auth');

const router = express.Router();

const ICLOUD_SHORTCUT_REGEX = /^https?:\/\/(www\.)?icloud\.com\/shortcuts\/[a-zA-Z0-9]+$/i;

function isValidShortcutUrl(url) {
  return ICLOUD_SHORTCUT_REGEX.test(url);
}

router.get('/', authOptional, (req, res) => {
  const { search, sort, userId, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(s.title LIKE ? OR s.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (userId) {
    conditions.push('s.user_id = ?');
    params.push(parseInt(userId));
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countSql = `SELECT COUNT(*) as total FROM shortcuts s ${where}`;
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
  const shortcut = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

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
  const { title, description, category, url } = req.body;

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

  const result = db.prepare(`
    INSERT INTO shortcuts (title, description, category, file_url, file_name, file_size, user_id)
    VALUES (?, ?, ?, ?, '', 0, ?)
  `).run(
    title,
    description || '',
    category || '其他',
    url,
    req.user.id
  );

  const shortcut = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `).get(result.lastInsertRowid);

  res.json({ shortcut });
});

router.delete('/:id', authRequired, (req, res) => {
  const db = getDb();
  const shortcut = db.prepare('SELECT * FROM shortcuts WHERE id = ?').get(req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己分享的快捷指令' });
  }

  db.prepare('DELETE FROM shortcuts WHERE id = ?').run(req.params.id);
  res.json({ message: '删除成功' });
});

router.get('/:id/download', (req, res) => {
  const db = getDb();
  const shortcut = db.prepare('SELECT * FROM shortcuts WHERE id = ?').get(req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  db.prepare('UPDATE shortcuts SET download_count = download_count + 1 WHERE id = ?').run(shortcut.id);

  res.redirect(shortcut.file_url);
});

module.exports = router;

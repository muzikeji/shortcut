const express = require('express');
const { getDb } = require('../database');
const { authRequired, adminRequired } = require('../auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.use(authRequired);
router.use(adminRequired);

router.get('/users', (req, res) => {
  const db = getDb();
  const { page = 1, limit = 20, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(u.username LIKE ? OR u.email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as total FROM users u ${where}`).get(...params).total;

  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.avatar, u.bio, u.role, u.banned, u.created_at,
      (SELECT COUNT(*) FROM shortcuts WHERE user_id = u.id) as shortcut_count
    FROM users u
    ${where}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    users,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

router.post('/users', (req, res) => {
  const db = getDb();
  const { username, email, password } = req.body;

  if (!username || username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度应为 2-20 个字符' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '请输入有效的邮箱地址' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于 6 位' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email);
  if (existingUser) {
    return res.status(409).json({ error: '用户名或邮箱已被占用' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (username, email, password, role)
    VALUES (?, ?, ?, 'admin')
  `).run(username, email, hashedPassword);

  const user = db.prepare(`
    SELECT u.id, u.username, u.email, u.avatar, u.bio, u.role, u.banned, u.created_at,
      (SELECT COUNT(*) FROM shortcuts WHERE user_id = u.id) as shortcut_count
    FROM users u
    WHERE u.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ user, message: '管理员创建成功' });
});

router.put('/users/:id/ban', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  if (user.role === 'admin') {
    return res.status(403).json({ error: '不能封禁管理员账号' });
  }

  db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(req.params.id);
  db.prepare("UPDATE shortcuts SET status = 'removed' WHERE user_id = ?").run(req.params.id);

  res.json({ message: '封禁成功' });
});

router.put('/users/:id/unban', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  db.prepare('UPDATE users SET banned = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: '解封成功' });
});

router.get('/shortcuts', (req, res) => {
  const db = getDb();
  const { page = 1, limit = 20, status, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(s.title LIKE ? OR u.username LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as total FROM shortcuts s LEFT JOIN users u ON s.user_id = u.id ${where}`).get(...params).total;

  const shortcuts = db.prepare(`
    SELECT s.*, u.username, u.avatar
    FROM shortcuts s
    LEFT JOIN users u ON s.user_id = u.id
    ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    shortcuts,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit))
  });
});

module.exports = router;

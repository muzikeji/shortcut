const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { generateToken, authRequired } = require('../auth');

const router = express.Router();

const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    if (!fs.existsSync(AVATAR_DIR)) {
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
    }
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG/PNG/GIF/WebP 格式的图片'));
    }
  }
});

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写所有必填字段' });
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度应为 2-20 个字符' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度不能少于 6 位' });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ error: '用户名或邮箱已被注册' });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashed);

  const user = { id: result.lastInsertRowid, username };
  const token = generateToken(user);

  res.json({ token, user: { id: user.id, username } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  if (user.banned) {
    return res.status(403).json({ error: '您的账号已被封禁' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role }
  });
});

router.get('/me', authRequired, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, avatar, bio, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ user });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, avatar, bio, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const count = db.prepare('SELECT COUNT(*) as total FROM shortcuts WHERE user_id = ?').get(user.id);
  res.json({ user: { ...user, shortcut_count: count.total } });
});

router.put('/profile', authRequired, (req, res) => {
  const { bio, username, email } = req.body;
  const db = getDb();

  if (username !== undefined) {
    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度应为 2-20 个字符' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
    if (existing) {
      return res.status(400).json({ error: '该用户名已被使用' });
    }
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) {
      return res.status(400).json({ error: '该邮箱已被使用' });
    }
  }

  const updates = [];
  const params = [];

  if (bio !== undefined) {
    updates.push('bio = ?');
    params.push(bio);
  }
  if (username !== undefined) {
    updates.push('username = ?');
    params.push(username);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有要更新的字段' });
  }

  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const user = db.prepare('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

router.put('/password', authRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '请输入当前密码和新密码' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于 6 位' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return res.status(400).json({ error: '当前密码不正确' });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);

  res.json({ message: '密码修改成功' });
});

router.post('/avatar', authRequired, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择头像图片' });
  }

  const avatarUrl = '/api/uploads/avatars/' + req.file.filename;
  const db = getDb();
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.user.id);

  const user = db.prepare('SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

module.exports = router;

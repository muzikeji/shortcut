const express = require('express');
const path = require('path');
const multer = require('multer');
const { getDb } = require('../database');
const { authRequired, authOptional } = require('../auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const ALLOWED_TYPES = [
  'application/octet-stream',
  'application/x-apple-aspen-config',
  'text/xml',
  'application/xml',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-www-form-urlencoded'
];

const MAX_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.shortcut') {
      cb(null, true);
    } else {
      cb(null, true);
    }
  }
});

router.get('/', authOptional, (req, res) => {
  const { search, sort, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '';
  const params = [];

  if (search) {
    where = 'WHERE s.title LIKE ? OR s.description LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

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

router.post('/', authRequired, upload.single('file'), (req, res) => {
  const { title, description, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: '请输入快捷指令名称' });
  }
  if (!req.file) {
    return res.status(400).json({ error: '请上传快捷指令文件' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO shortcuts (title, description, category, file_url, file_name, file_size, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    description || '',
    category || '其他',
    '/api/uploads/' + req.file.filename,
    req.file.originalname,
    req.file.size,
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

  const filePath = path.join(UPLOAD_DIR, path.basename(shortcut.file_url));
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  res.download(filePath, shortcut.file_name);
});

module.exports = router;

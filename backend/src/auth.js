const jwt = require('jsonwebtoken');
const { getDb } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'shortcut-community-secret-key-2024';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = getDb();
    const user = db.prepare('SELECT id, username, role, banned FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    if (user.banned) {
      return res.status(403).json({ error: '您的账号已被封禁' });
    }

    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  next();
}

module.exports = { generateToken, authRequired, authOptional, adminRequired };

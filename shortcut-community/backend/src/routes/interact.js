const express = require('express');
const { getDb } = require('../database');
const { authRequired, authOptional } = require('../auth');

const router = express.Router();

router.post('/:shortcutId/like', authRequired, (req, res) => {
  const db = getDb();
  const { shortcutId } = req.params;

  const shortcut = db.prepare('SELECT id FROM shortcuts WHERE id = ?').get(shortcutId);
  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  const existing = db.prepare('SELECT id FROM likes WHERE shortcut_id = ? AND user_id = ?')
    .get(shortcutId, req.user.id);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE shortcut_id = ? AND user_id = ?')
      .run(shortcutId, req.user.id);
    db.prepare('UPDATE shortcuts SET like_count = like_count - 1 WHERE id = ?').run(shortcutId);
    const { like_count } = db.prepare('SELECT like_count FROM shortcuts WHERE id = ?').get(shortcutId);
    res.json({ liked: false, like_count });
  } else {
    db.prepare('INSERT INTO likes (shortcut_id, user_id) VALUES (?, ?)')
      .run(shortcutId, req.user.id);
    db.prepare('UPDATE shortcuts SET like_count = like_count + 1 WHERE id = ?').run(shortcutId);
    const { like_count } = db.prepare('SELECT like_count FROM shortcuts WHERE id = ?').get(shortcutId);
    res.json({ liked: true, like_count });
  }
});

router.get('/:shortcutId/comments', authOptional, (req, res) => {
  const db = getDb();
  const { shortcutId } = req.params;

  const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.shortcut_id = ?
    ORDER BY c.created_at DESC
  `).all(shortcutId);

  res.json({ comments });
});

router.post('/:shortcutId/comments', authRequired, (req, res) => {
  const db = getDb();
  const { shortcutId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: '请输入评论内容' });
  }

  const shortcut = db.prepare('SELECT id FROM shortcuts WHERE id = ?').get(shortcutId);
  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }

  const result = db.prepare('INSERT INTO comments (shortcut_id, user_id, content) VALUES (?, ?, ?)')
    .run(shortcutId, req.user.id, content.trim());

  db.prepare('UPDATE shortcuts SET comment_count = comment_count + 1 WHERE id = ?').run(shortcutId);

  const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.json({ comment });
});

router.delete('/:shortcutId/comments/:commentId', authRequired, (req, res) => {
  const db = getDb();
  const { shortcutId, commentId } = req.params;

  const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND shortcut_id = ?')
    .get(commentId, shortcutId);

  if (!comment) {
    return res.status(404).json({ error: '评论不存在' });
  }
  if (comment.user_id !== req.user.id) {
    return res.status(403).json({ error: '只能删除自己的评论' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);
  db.prepare('UPDATE shortcuts SET comment_count = comment_count - 1 WHERE id = ?').run(shortcutId);

  res.json({ message: '删除成功' });
});

module.exports = router;

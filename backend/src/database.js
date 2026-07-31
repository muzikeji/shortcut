const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'shortcuts.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shortcuts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT '其他',
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      download_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortcut_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shortcut_id) REFERENCES shortcuts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(shortcut_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortcut_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shortcut_id) REFERENCES shortcuts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS shortcut_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shortcut_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      version_note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shortcut_id) REFERENCES shortcuts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_shortcuts_user ON shortcuts(user_id);
    CREATE INDEX IF NOT EXISTS idx_shortcuts_created ON shortcuts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_likes_shortcut ON likes(shortcut_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_shortcut ON comments(shortcut_id);
    CREATE INDEX IF NOT EXISTS idx_versions_shortcut ON shortcut_versions(shortcut_id);
  `);

  try {
    db.exec(`ALTER TABLE users ADD COLUMN bio TEXT DEFAULT ''`);
  } catch {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  } catch {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0`);
  } catch {}

  try {
    db.exec(`ALTER TABLE shortcuts ADD COLUMN status TEXT DEFAULT 'active'`);
  } catch {}

  try {
    db.exec(`ALTER TABLE shortcuts ADD COLUMN slug TEXT`);
  } catch {}

  try {
    db.exec(`ALTER TABLE shortcuts ADD COLUMN color TEXT DEFAULT ''`);
  } catch {}

  try {
    db.exec(`ALTER TABLE shortcuts ADD COLUMN stats TEXT DEFAULT ''`);
  } catch {}

  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_shortcuts_slug ON shortcuts(slug)`);
  } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `);

  // 为已有记录生成 slug
  const existing = db.prepare('SELECT id, created_at FROM shortcuts WHERE slug IS NULL').all();
  if (existing.length > 0) {
    const update = db.prepare('UPDATE shortcuts SET slug = ? WHERE id = ?');
    const updateTx = db.transaction((rows) => {
      rows.forEach(row => {
        const ts = new Date(row.created_at).getTime();
        const slug = ts.toString() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        update.run(slug, row.id);
      });
    });
    updateTx(existing);
  }
}

module.exports = { getDb };

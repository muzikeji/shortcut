const express = require('express');
const { getDb } = require('../database');
const { authRequired, adminRequired } = require('../auth');

const router = express.Router();

const DEFAULTS = {
  siteName: '捷径社区',
  siteDescription: 'iOS 快捷指令分享社区',
  logoUrl: '/logo.png',
  icpBeian: '',
  seoTitle: '',
  seoDescription: '分享和发现实用的 iOS 快捷指令',
};

router.get('/', (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = { ...DEFAULTS };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

router.put('/', authRequired, adminRequired, (req, res) => {
  const db = getDb();
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const allowed = Object.keys(DEFAULTS);

  const tx = db.transaction((body) => {
    for (const key of allowed) {
      if (key in body && typeof body[key] === 'string') {
        upsert.run(key, body[key]);
      }
    }
  });
  tx(req.body);

  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = { ...DEFAULTS };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

module.exports = router;

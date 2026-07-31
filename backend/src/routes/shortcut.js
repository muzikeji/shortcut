const express = require('express');
const { getDb } = require('../database');
const { authRequired, authOptional } = require('../auth');
const bplist = require('bplist-parser');

const router = express.Router();

const ICLOUD_SHORTCUT_REGEX = /^https?:\/\/(www\.)?icloud\.com\/shortcuts\/[a-zA-Z0-9]+$/i;

function isValidShortcutUrl(url) {
  return ICLOUD_SHORTCUT_REGEX.test(url);
}

function generateSlug() {
  return String(Math.floor(Date.now() / 1000));
}

function extractShortcutId(url) {
  const m = url.match(/icloud\.com\/shortcuts\/([a-zA-Z0-9]+)/i);
  return m ? m[1] : '';
}

function decodeIconColor(value) {
  if (typeof value !== 'number') return null;
  const r = (value >>> 24) & 0xff;
  const g = (value >>> 16) & 0xff;
  const b = (value >>> 8) & 0xff;
  const a = value & 0xff;
  if (a === 0) return null;
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function fetchShortcutMeta(url) {
  const id = extractShortcutId(url);
  if (!id) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`https://www.icloud.com/shortcuts/api/records/${id}?locale=zh_CN`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const name = data?.fields?.name?.value;
    const color = decodeIconColor(data?.fields?.icon_color?.value);
    const shortcutAsset = data?.fields?.shortcut?.value;
    return {
      name: typeof name === 'string' ? name.trim() : '',
      color,
      shortcutUrl: shortcutAsset?.downloadURL?.replace('${f}', 'shortcut'),
      shortcutSize: shortcutAsset?.size || 0,
    };
  } catch (e) {
    return null;
  }
}

// 动作标识 → 权限
const PERMISSION_ACTIONS = {
  'savetocameraroll': '照片',
  'getphotos': '照片',
  'selectphotos': '照片',
  'setwallpaper': '壁纸',
  'contact': '通讯录',
  'getcontacts': '通讯录',
  'selectcontact': '通讯录',
  'getcalendar': '日历',
  'calendar': '日历',
  'createevent': '日历',
  'sendmessage': '信息',
  'sendemail': '邮件',
  'call': '电话',
  'facetime': 'FaceTime',
  'getlocation': '定位',
  'getcurrentlocation': '定位',
  'openinmaps': '定位',
  'reminders': '提醒事项',
  'addnewreminder': '提醒事项',
  'getreminders': '提醒事项',
  'gethealth': '健康',
  'health': '健康',
  'savedetailsfromfitnessapp': '健康',
  'playmusic': '音乐',
  'getcurrentsong': '音乐',
  'files': '文件',
  'getfile': '文件',
  'createfolder': '文件',
  'getfolder': '文件',
  'getcontentsoffolder': '文件',
  'getitemsofdata': '文件',
  'savetofile': '文件',
  'runapp': '打开应用',
  'openapp': '打开应用',
  'launchapp': '打开应用',
  'open': '打开应用',
  'getclipsboard': '剪贴板',
  'getclipboard': '剪贴板',
  'setclipboard': '剪贴板',
  'getbatterylevel': '电池',
  'wifi': '网络',
  'getwifi': '网络',
  'vpn': 'VPN',
  'bluetooth': '蓝牙',
  'getbluetooth': '蓝牙',
  'sendnotification': '通知',
  'notification': '通知',
  'shownotification': '通知',
  'vibrate': '振动',
  'flashlight': '手电筒',
  'setbrightness': '屏幕亮度',
  'setvolume': '音量',
  'lowpowermode': '低电量模式',
  'dozbemode': '专注模式',
  'focus': '专注模式',
  'setfocusedstatus': '专注模式',
  'startworkout': '体能训练',
  'workout': '体能训练',
  'recordaudio': '麦克风',
  'recordaudiomemo': '麦克风',
  'takephoto': '相机',
  'takephotovideo': '相机',
  'video': '相机',
  'scanqrcode': '相机',
  'scan': '相机',
  'getscreenbrightness': '屏幕亮度',
  'appstore': 'App Store',
  'searchappstore': 'App Store',
  'lookup': 'App Store',
  'wifi-connect': '网络',
};

const PERMISSION_ICONS = {
  '照片': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  '定位': 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  '相机': 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z',
  '麦克风': 'M19 11a7 7 0 01-14 0m7 7v3m0 0H9m4 0h-4',
  '通讯录': 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  '日历': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  '信息': 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  '邮件': 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  '电话': 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  '文件': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  '剪贴板': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  '通知': 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  '网络': 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.07c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  '蓝牙': 'M7 8l10 8-5 4V4l5 4-10 8',
  '健康': 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  '音乐': 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z',
  '提醒事项': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  '壁纸': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  '电池': 'M22 12v3h-3M2 9v3M4 15a8 8 0 0016 0M4 15a8 8 0 0016 0',
  '手电筒': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0015 18.5V19a1 1 0 01-1 1h-4a1 1 0 01-1-1v-.5c0-.83-.264-1.653-.848-2.313l-.55-.55z',
  '屏幕亮度': 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  '音量': 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z',
  'App Store': 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 1.096A4.001 4.001 0 003 15z',
  '打开应用': 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  'FaceTime': 'M3 5a2 2 0 012-2h8a2 2 0 012 2v.5l5.8-2.9a1 1 0 011.2.9v13a1 1 0 01-1.2.9L15 14.5V15a2 2 0 01-2 2H5a2 2 0 01-2-2V5z',
};

async function parseShortcutStats(shortcutUrl) {
  if (!shortcutUrl) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(shortcutUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const parsed = await bplist.parseBuffer(buf);
    const wf = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!wf?.WFWorkflowActions) return null;

    const actions = wf.WFWorkflowActions;
    const actionNames = [];
    const permissions = new Set();
    actions.forEach(a => {
      const ident = a?.WFWorkflowActionIdentifier || '';
      const last = ident.split('.').pop();
      actionNames.push(ident);
      const perm = PERMISSION_ACTIONS[last];
      if (perm) permissions.add(perm);
    });

    let minVersion = '';
    const rawVersion = wf.WFWorkflowMinimumClientVersion || wf.WFWorkflowMinimumSystemVersion;
    if (rawVersion != null) {
      const v = String(rawVersion).split('.');
      minVersion = 'iOS ' + v.slice(0, 2).join('.');
    }

    // 调试：日志输出 bplist 顶层 key，排查未命中的字段
    console.log('[stats debug] plist keys:', Object.keys(wf).filter(k => k.toLowerCase().includes('version') || k.toLowerCase().includes('min') || k.toLowerCase().includes('system') || k.toLowerCase().includes('import')));

    const detailActionNames = Array.from(new Set(actionNames.map(a => a.split('.').pop())));

    return {
      actionCount: actions.length,
      size: buf.length,
      permissions: [...permissions],
      actionTypes: actionNames,
      name: wf.WFWorkflowName || '',
      minVersion,
      workflowTypes: Array.isArray(wf.WFWorkflowTypes) ? wf.WFWorkflowTypes : [],
      importQuestions: Array.isArray(wf.WFWorkflowImportQuestions) ? wf.WFWorkflowImportQuestions.length : 0,
      distinctActionCount: detailActionNames.length,
    };
  } catch (e) {
    return null;
  }
}

router.post('/fetch-name', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidShortcutUrl(url)) {
    return res.status(400).json({ error: '无效的 iCloud 快捷指令链接' });
  }
  const meta = await fetchShortcutMeta(url);
  if (!meta || !meta.name) {
    return res.status(404).json({ error: '未能获取快捷指令名称' });
  }
  const stats = await parseShortcutStats(meta.shortcutUrl);
  res.json({
    name: meta.name,
    color: meta.color,
    stats,
  });
});

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

router.post('/', authRequired, async (req, res) => {
  const { title, description, category, url, slug, color } = req.body;

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

  const meta = await fetchShortcutMeta(url);
  const stats = await parseShortcutStats(meta?.shortcutUrl);
  const statsJson = stats ? JSON.stringify(stats) : '';

  const finalColor = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : (meta?.color || '');

  const result = db.prepare(`
    INSERT INTO shortcuts (slug, title, description, category, file_url, file_name, file_size, user_id, color, stats)
    VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)
  `).run(
    finalSlug,
    meta?.name || title,
    description || '',
    category || '其他',
    url,
    stats?.size || 0,
    req.user.id,
    finalColor,
    statsJson
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

router.post('/:id/refresh-stats', authRequired, async (req, res) => {
  const db = getDb();
  const shortcut = idParam(db, req.params.id);

  if (!shortcut) {
    return res.status(404).json({ error: '快捷指令不存在' });
  }
  if (shortcut.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权刷新该快捷指令的统计信息' });
  }
  if (!shortcut.file_url) {
    return res.status(400).json({ error: '该快捷指令缺少链接，无法刷新统计' });
  }

  const meta = await fetchShortcutMeta(shortcut.file_url);
  if (!meta || !meta.shortcutUrl) {
    return res.status(500).json({ error: '未能获取快捷指令下载地址，请检查链接是否仍然有效' });
  }

  const stats = await parseShortcutStats(meta.shortcutUrl);
  if (!stats) {
    return res.status(500).json({ error: '统计信息抓取失败，请稍后重试' });
  }

  const statsJson = JSON.stringify(stats);
  db.prepare('UPDATE shortcuts SET stats = ? WHERE id = ?').run(statsJson, shortcut.id);
  res.json({ stats });
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

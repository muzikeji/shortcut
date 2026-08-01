import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { Shortcut, Comment, ShortcutVersion } from './types';

const CATEGORIES = ['效率', '工具', '娱乐', '健康', '学习', '生活', '其他'];
const COMMENT_PREVIEW_COUNT = 5;

const PERMISSION_ICONS: Record<string, string> = {
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


export default function ShortcutDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [shortcut, setShortcut] = useState<Shortcut | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [versions, setVersions] = useState<ShortcutVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [versionNote, setVersionNote] = useState('');
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState('');

  const [similar, setSimilar] = useState<Shortcut[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getShortcut(id)
      .then(async (shortcutData) => {
        const shortcut = shortcutData.shortcut;
        setShortcut(shortcut);
        const [commentData, versionData, similarData] = await Promise.all([
          api.getComments(shortcut.id),
          api.getVersions(shortcut.id),
          api.getSimilar(shortcut.id),
        ]);
        setComments(commentData.comments);
        setVersions(versionData.versions);
        setSimilar(similarData.shortcuts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      alert('请先登录后再点赞');
      return;
    }
    if (!shortcut) return;
    try {
      const data = await api.toggleLike(shortcut.id);
      setShortcut({ ...shortcut, liked: data.liked, like_count: data.like_count });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const { commentTree, commentMap } = useMemo(() => {
    const map: Record<number, Comment> = {};
    const roots: Comment[] = [];
    for (const c of comments) {
      map[c.id] = { ...c, replies: [] };
    }
    for (const c of comments) {
      const node = map[c.id];
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies!.push(node);
      } else {
        roots.push(node);
      }
    }
    return { commentTree: roots, commentMap: map };
  }, [comments]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录后再评论');
      return;
    }
    if (!commentText.trim() || !shortcut) return;

    setCommentLoading(true);
    try {
      const data = await api.addComment(shortcut.id, commentText.trim());
      setComments([data.comment, ...comments]);
      setShortcut({ ...shortcut, comment_count: shortcut.comment_count + 1 });
      setCommentText('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReply = async (parentId: number) => {
    if (!user) {
      alert('请先登录后再评论');
      return;
    }
    if (!replyText.trim() || !shortcut) return;

    setReplyLoading(true);
    try {
      const data = await api.addComment(shortcut.id, replyText.trim(), parentId);
      setComments([data.comment, ...comments]);
      setShortcut({ ...shortcut, comment_count: shortcut.comment_count + 1 });
      setReplyText('');
      setReplyTo(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!shortcut || !confirm('确定要删除该评论吗？')) return;
    try {
      const data = await api.deleteComment(shortcut.id, commentId);
      setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
      setShortcut({ ...shortcut, comment_count: shortcut.comment_count - (1 + (data.deleted_replies || 0)) });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRemove = async () => {
    if (!shortcut) return;
    if (!confirm('确定要下架该分享吗？')) return;
    setActionLoading(true);
    try {
      await api.removeShortcut(shortcut.id);
      setShortcut({ ...shortcut, status: 'removed' });
    } catch (e: any) {
      console.error('下架失败', e);
      alert(e.message || '下架失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!shortcut) return;
    setActionLoading(true);
    try {
      await api.restoreShortcut(shortcut.id);
      setShortcut({ ...shortcut, status: 'active' });
    } catch (e: any) {
      console.error('恢复失败', e);
      alert(e.message || '恢复失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshStats = async () => {
    if (!shortcut) return;
    setRefreshLoading(true);
    try {
      const data = await api.refreshStats(shortcut.id);
      if (data.stats) {
        setShortcut({ ...shortcut, stats: JSON.stringify(data.stats) });
      }
    } catch (e: any) {
      console.error('刷新统计失败', e);
      alert(e.message || '统计刷新失败，请重试');
    } finally {
      setRefreshLoading(false);
    }
  };

  const startEditing = () => {
    if (!shortcut) return;
    setEditTitle(shortcut.title);
    setEditDescription(shortcut.description || '');
    setEditCategory(shortcut.category);
    setEditError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      setEditError('请输入快捷指令名称');
      return;
    }
    if (!shortcut) return;

    setEditLoading(true);
    setEditError('');
    try {
      const data = await api.updateShortcut(shortcut.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
      });
      setShortcut(data.shortcut);
      setEditing(false);
    } catch (e: any) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcut) return;
    setVersionError('');
    if (!newUrl.trim()) {
      setVersionError('请提供新的快捷指令链接');
      return;
    }
    setVersionLoading(true);
    try {
      const data = await api.addVersion(shortcut.id, {
        url: newUrl.trim(),
        version_note: versionNote.trim(),
      });
      setVersions(data.versions);
      const updated: Partial<Shortcut> = { file_url: newUrl.trim() };
      if (data.stats) {
        updated.stats = JSON.stringify(data.stats);
      }
      setShortcut({ ...shortcut, ...updated });
      setNewUrl('');
      setVersionNote('');
      setShowVersionForm(false);
    } catch (e: any) {
      setVersionError(e.message);
    } finally {
      setVersionLoading(false);
    }
  };

  const isOwner = user && shortcut && user.id === shortcut.user_id;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  if (!shortcut) {
    return <div className="text-center py-20 text-gray-400">快捷指令不存在</div>;
  }

  const theme = /^#[0-9a-fA-F]{6}$/.test(shortcut.color || '') ? shortcut.color : '#3B82F6';

  const similarSection = (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">相似推荐</h3>
      {similar.length === 0 ? (
        <p className="text-xs text-gray-400">暂无相似推荐</p>
      ) : (
        <div className="space-y-3">
          {similar.map(s => (
            <Link
              key={s.id}
              to={`/shortcut/${s.slug}`}
              className="block hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-gray-800 line-clamp-1">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {s.username} · {s.like_count} 赞 · {s.download_count} 次下载
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const mainContent = (
    <div className="min-w-0 flex-1">
      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
        &larr; 返回列表
      </Link>

      <div
        className="bg-white rounded-xl border p-6 mb-6"
        style={{ borderColor: `${theme}40`, backgroundColor: `${theme}08` }}
      >
        {editing ? (
          <div className="space-y-3">
            {editError && (
              <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs">{editError}</div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">名称</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">分类</label>
              <select
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">描述</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="描述这个快捷指令的功能..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={editLoading}
                className="bg-blue-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {editLoading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={cancelEditing}
                className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${theme}1A`, color: theme }}>
                {shortcut.category}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(shortcut.created_at).toLocaleDateString('zh-CN')}
              </span>
              {shortcut.status === 'removed' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                  已下架
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-3">{shortcut.title}</h1>
            <p className="text-gray-600 mb-4">{shortcut.description || '暂无描述'}</p>

            <div className="flex items-center text-sm text-gray-500 mb-4 gap-4">
              <span>分享者: <Link to={`/user/${shortcut.user_id}`} className="hover:underline" style={{ color: theme }}>{shortcut.username}</Link></span>
            </div>

            <div className="flex items-center text-sm text-gray-500 mb-5">
              <span className="truncate max-w-md">
                <span className="text-gray-400">链接: </span>
                {shortcut.file_url}
              </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href={api.getDownloadUrl(shortcut.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                获取快捷指令
              </a>

              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium ${shortcut.liked ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4" fill={shortcut.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {shortcut.like_count} 赞
              </button>

              <span className="flex items-center gap-1.5 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {shortcut.download_count} 次下载
              </span>
            </div>

            {(() => {
              let stats: {
                actionCount?: number;
                size?: number;
                permissions?: string[];
                name?: string;
                minVersion?: string;
                workflowTypes?: string[];
                importQuestions?: number;
                distinctActionCount?: number;
              } | null = null;
              try {
                if (shortcut.stats) stats = JSON.parse(shortcut.stats);
              } catch { stats = null; }
              if (!stats) return null;
              return (
                <div className="mt-5 bg-white rounded-xl border border-gray-200 p-4">
                  {(isOwner || isAdmin) && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">统计信息</span>
                      <button
                        onClick={handleRefreshStats}
                        disabled={refreshLoading}
                        className="text-xs text-blue-500 hover:text-blue-600 disabled:text-gray-300 flex items-center gap-1"
                      >
                        {refreshLoading ? (
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        刷新统计
                      </button>
                    </div>
                  )}
                  <div className="divide-y divide-gray-100">
                    <div className="flex items-center py-3">
                      <span className="text-xs font-medium text-gray-400 w-24 shrink-0">操作步骤</span>
                      <span className="text-sm text-gray-800 font-medium">{stats.actionCount ?? '-'} 步</span>
                    </div>
                    <div className="flex items-center py-3">
                      <span className="text-xs font-medium text-gray-400 w-24 shrink-0">文件大小</span>
                      <span className="text-sm text-gray-800 font-medium">{stats.size ? (stats.size / 1024).toFixed(1) + ' KB' : '-'}</span>
                    </div>
                    <div className="flex items-center py-3">
                      <span className="text-xs font-medium text-gray-400 w-24 shrink-0">最低系统</span>
                      <span className="text-sm text-gray-800 font-medium">{stats.minVersion || '-'}</span>
                    </div>
                    <div className="flex items-center py-3">
                      <span className="text-xs font-medium text-gray-400 w-24 shrink-0">动作种类</span>
                      <span className="text-sm text-gray-800 font-medium">{stats.distinctActionCount != null ? `${stats.distinctActionCount} 种` : '-'}</span>
                    </div>
                    <div className="flex py-3">
                      <span className="text-xs font-medium text-gray-400 w-24 shrink-0 pt-0.5">访问权限</span>
                      <div>
                        {(stats.permissions && stats.permissions.length > 0) ? (
                          <div className="flex flex-wrap gap-1.5">
                            {stats.permissions.map(p => (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${theme}14`, color: theme }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={PERMISSION_ICONS[p] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
                                </svg>
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">无</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center py-3">
                      <span className="text-xs font-medium text-gray-400 w-24 shrink-0">导入问题</span>
                      <span className="text-sm text-gray-800 font-medium">{stats.importQuestions != null ? `${stats.importQuestions} 个` : '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* 操作按钮 */}
      {(isOwner || isAdmin) && !editing && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={startEditing}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            编辑信息
          </button>
          <button
            onClick={() => {
              setShowVersionForm(!showVersionForm);
              setVersionError('');
            }}
            className="text-sm font-medium hover:underline"
            style={{ color: theme }}
          >
            更新版本
          </button>
          {versions.length > 1 && (
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              {showVersions ? '收起版本记录' : `版本记录 (${versions.length})`}
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {shortcut.status === 'removed' ? (
              <button
                onClick={handleRestore}
                disabled={actionLoading}
                className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '恢复上架'}
              </button>
            ) : (
              <button
                onClick={handleRemove}
                disabled={actionLoading}
                className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '下架'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 更新版本表单 */}
      {showVersionForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">更新版本</h3>
          <form onSubmit={handleAddVersion} className="space-y-3">
            {versionError && (
              <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs">{versionError}</div>
            )}
            <div>
              <label className="block text-xs text-gray-500 mb-1">新 iCloud 链接</label>
              <input
                type="url"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://www.icloud.com/shortcuts/xxx"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">更新说明</label>
              <input
                type="text"
                value={versionNote}
                onChange={e => setVersionNote(e.target.value)}
                placeholder="本次更新的内容..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={versionLoading}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {versionLoading ? '提交中...' : '提交更新'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVersionForm(false);
                  setVersionError('');
                }}
                className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 版本历史 */}
      {showVersions && versions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">版本记录</h3>
          <div className="space-y-3">
            {versions.map((v, i) => (
              <div key={v.id} className={`flex gap-3 ${i < versions.length - 1 ? 'pb-3 border-b border-gray-100' : ''}`}>
                <div className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(v.created_at).toLocaleString('zh-CN')}
                    </span>
                    {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">当前</span>}
                  </div>
                  {v.version_note && (
                    <p className="text-sm text-gray-600 mt-1">{v.version_note}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 truncate">{v.url}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 评论区 */}
      {shortcut.status === 'removed' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm mb-6">
          该分享已被下架，评论功能已关闭
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            评论 ({shortcut.comment_count})
          </h2>

          {user ? (
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={commentLoading || !commentText.trim()}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {commentLoading ? '提交中...' : '发表评论'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
              请
              <Link to="/login" className="text-blue-600 hover:underline mx-1">登录</Link>
              后发表评论
            </div>
          )}

          {comments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">暂无评论</p>
          ) : (
            <div className="space-y-4">
              {(showAllComments ? commentTree : commentTree.slice(0, COMMENT_PREVIEW_COUNT)).map(c => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  theme={theme}
                  user={user}
                  replyTo={replyTo}
                  replyText={replyText}
                  replyLoading={replyLoading}
                  commentMap={commentMap}
                  onReply={(target) => { setReplyTo(target); if (!target) setReplyText(''); }}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={handleReply}
                  onDelete={handleDeleteComment}
                />
              ))}
              {!showAllComments && commentTree.length > COMMENT_PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                >
                  展开剩余 {commentTree.length - COMMENT_PREVIEW_COUNT} 条评论
                </button>
              )}
              {showAllComments && commentTree.length > COMMENT_PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllComments(false)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  收起评论
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 相似推荐 -- 小屏幕下显示 */}
      <div className="lg:hidden mb-6">
        {similarSection}
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 py-6 max-w-[1600px] mx-auto">
      <div className="flex gap-6">
        {mainContent}
        {/* 相似推荐 -- 大屏幕右侧栏 */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-20">
            {similarSection}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReplyTarget {
  id: number;
  username: string;
}

interface CommentItemProps {
  comment: Comment;
  theme: string;
  user: { id: number; role?: string } | null;
  replyTo: ReplyTarget | null;
  replyText: string;
  replyLoading: boolean;
  commentMap: Record<number, Comment>;
  onReply: (target: ReplyTarget | null) => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
}

function flattenReplies(replies: Comment[]): Comment[] {
  const result: Comment[] = [];
  for (const r of replies) {
    result.push(r);
    if (r.replies && r.replies.length > 0) {
      result.push(...flattenReplies(r.replies));
    }
  }
  return result;
}

function AvatarImg({ src, name, theme, size }: { src?: string; name: string; theme: string; size: string }) {
  if (src) {
    return <img src={src} className={`${size} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full flex items-center justify-center text-white shrink-0 font-medium`} style={{ backgroundColor: theme, fontSize: size === 'w-8 h-8' ? '14px' : '11px' }}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function InlineReplyForm({
  target,
  replyText,
  replyLoading,
  onReplyTextChange,
  onSubmitReply,
  onCancel,
}: {
  target: ReplyTarget;
  replyText: string;
  replyLoading: boolean;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: (parentId: number) => void;
  onCancel: () => void;
}) {
  return (
    <div className="ml-11 mt-2 mb-1">
      <textarea
        value={replyText}
        onChange={e => onReplyTextChange(e.target.value)}
        placeholder={`回复 @${target.username}...`}
        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
        rows={2}
      />
      <div className="flex justify-end gap-2 mt-1.5">
        <button onClick={onCancel} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">取消</button>
        <button onClick={() => onSubmitReply(target.id)} disabled={replyLoading || !replyText.trim()} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
          {replyLoading ? '提交中...' : '回复'}
        </button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  theme,
  user,
  replyTo,
  replyText,
  replyLoading,
  commentMap,
  onReply,
  onReplyTextChange,
  onSubmitReply,
  onDelete,
}: CommentItemProps) {
  const flatReplies = useMemo(() =>
    comment.replies ? flattenReplies(comment.replies) : [],
    [comment.replies]
  );

  return (
    <div>
      {/* 主评论 */}
      <div className="flex gap-3">
        <Link to={`/user/${comment.user_id}`} className="shrink-0">
          <AvatarImg src={comment.avatar} name={comment.username} theme={theme} size="w-8 h-8" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/user/${comment.user_id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600">{comment.username}</Link>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5 break-words">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            {user && (
              <button
                onClick={() => onReply(replyTo?.id === comment.id ? null : { id: comment.id, username: comment.username })}
                className="text-xs text-gray-400 hover:text-blue-500"
              >
                回复
              </button>
            )}
            {user?.id === comment.user_id && (
              <button onClick={() => onDelete(comment.id)} className="text-xs text-gray-400 hover:text-red-500">删除</button>
            )}
          </div>
        </div>
      </div>

      {replyTo?.id === comment.id && (
        <InlineReplyForm
          target={replyTo}
          replyText={replyText}
          replyLoading={replyLoading}
          onReplyTextChange={onReplyTextChange}
          onSubmitReply={onSubmitReply}
          onCancel={() => onReply(null)}
        />
      )}

      {/* 扁平化的所有子回复 */}
      {flatReplies.length > 0 && (
        <div className="ml-11 mt-2 space-y-2.5">
          {flatReplies.map(r => {
            const replyParentUsername = r.parent_id ? commentMap[r.parent_id]?.username : null;
            return (
              <div key={r.id}>
                <div className="flex gap-2.5">
                  <Link to={`/user/${r.user_id}`} className="shrink-0">
                    <AvatarImg src={r.avatar} name={r.username} theme={theme} size="w-6 h-6" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap leading-tight">
                      <Link to={`/user/${r.user_id}`} className="text-xs font-medium text-gray-800 hover:text-blue-600">{r.username}</Link>
                      {replyParentUsername && (
                        <>
                          <span className="text-xs text-gray-400">回复</span>
                          <span className="text-xs text-blue-500">@{replyParentUsername}</span>
                        </>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 break-words">{r.content}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {user && (
                        <button
                          onClick={() => onReply(replyTo?.id === r.id ? null : { id: r.id, username: r.username })}
                          className="text-xs text-gray-400 hover:text-blue-500"
                        >
                          回复
                        </button>
                      )}
                      {user?.id === r.user_id && (
                        <button onClick={() => onDelete(r.id)} className="text-xs text-gray-400 hover:text-red-500">删除</button>
                      )}
                    </div>
                  </div>
                </div>
                {replyTo?.id === r.id && (
                  <InlineReplyForm
                    target={replyTo}
                    replyText={replyText}
                    replyLoading={replyLoading}
                    onReplyTextChange={onReplyTextChange}
                    onSubmitReply={onSubmitReply}
                    onCancel={() => onReply(null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

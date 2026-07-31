import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { Shortcut, Comment, ShortcutVersion } from './types';
import { CATEGORY_COLORS } from './types';

const CATEGORIES = ['效率', '工具', '娱乐', '健康', '学习', '生活', '其他'];
const COMMENT_PREVIEW_COUNT = 5;

const CATEGORY_ACCENT: Record<string, string> = {
  '效率': 'bg-blue-600 hover:bg-blue-700',
  '工具': 'bg-green-600 hover:bg-green-700',
  '娱乐': 'bg-purple-600 hover:bg-purple-700',
  '健康': 'bg-red-600 hover:bg-red-700',
  '学习': 'bg-yellow-500 hover:bg-yellow-600',
  '生活': 'bg-pink-600 hover:bg-pink-700',
  '其他': 'bg-gray-600 hover:bg-gray-700',
};

const CATEGORY_ACCENT_TEXT: Record<string, string> = {
  '效率': 'text-blue-600 hover:text-blue-800',
  '工具': 'text-green-600 hover:text-green-800',
  '娱乐': 'text-purple-600 hover:text-purple-800',
  '健康': 'text-red-600 hover:text-red-800',
  '学习': 'text-yellow-600 hover:text-yellow-800',
  '生活': 'text-pink-600 hover:text-pink-800',
  '其他': 'text-gray-600 hover:text-gray-800',
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

  const handleDeleteComment = async (commentId: number) => {
    if (!shortcut) return;
    try {
      await api.deleteComment(shortcut.id, commentId);
      setComments(comments.filter(c => c.id !== commentId));
      setShortcut({ ...shortcut, comment_count: shortcut.comment_count - 1 });
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
      alert(e.message);
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
      alert(e.message);
    } finally {
      setActionLoading(false);
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
      setShortcut({ ...shortcut, file_url: newUrl.trim() });
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

  const colors = CATEGORY_COLORS[shortcut.category] || CATEGORY_COLORS['其他'];
  const previewComments = comments.slice(0, COMMENT_PREVIEW_COUNT);
  const remainingCount = comments.length - COMMENT_PREVIEW_COUNT;

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

      <div className={`bg-white rounded-xl border ${colors.border} p-6 mb-6 ${colors.light}`}>
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
              <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
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
              <span>分享者: <Link to={`/user/${shortcut.user_id}`} className="text-blue-600 hover:text-blue-800">{shortcut.username}</Link></span>
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
                className={`text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2 ${CATEGORY_ACCENT[shortcut.category] || CATEGORY_ACCENT['其他']}`}
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
            className={`text-sm font-medium ${CATEGORY_ACCENT_TEXT[shortcut.category] || CATEGORY_ACCENT_TEXT['其他']}`}
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
              {(showAllComments ? comments : previewComments).map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className={`w-8 h-8 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center text-sm font-medium shrink-0`}>
                    {c.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-800">{c.username}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 break-words">{c.content}</p>
                    {user?.id === c.user_id && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-xs text-gray-400 hover:text-red-500 mt-1"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!showAllComments && remainingCount > 0 && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                >
                  展开剩余 {remainingCount} 条评论
                </button>
              )}
              {showAllComments && comments.length > COMMENT_PREVIEW_COUNT && (
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

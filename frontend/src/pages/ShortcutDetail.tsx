import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { Shortcut, Comment } from './types';

const CATEGORIES = ['效率', '工具', '娱乐', '健康', '学习', '生活', '其他'];

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getShortcut(Number(id)),
      api.getComments(Number(id)),
    ])
      .then(([shortcutData, commentData]) => {
        setShortcut(shortcutData.shortcut);
        setComments(commentData.comments);
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

  const isOwner = user && shortcut && user.id === shortcut.user_id;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  if (!shortcut) {
    return <div className="text-center py-20 text-gray-400">快捷指令不存在</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 mb-4 inline-block">
        &larr; 返回列表
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
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
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
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
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
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

              {(isOwner || isAdmin) && (
                <div className="flex items-center gap-2 ml-auto border-l border-gray-200 pl-4">
                  <button
                    onClick={startEditing}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    编辑
                  </button>
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
              )}
            </div>
          </>
        )}
      </div>

      {/* 评论区 */}
      {shortcut.status === 'removed' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
          该分享已被下架，评论功能已关闭
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

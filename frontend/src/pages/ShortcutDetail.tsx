import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import type { Shortcut, ShortcutVersion } from './types';
import PERMISSION_ICONS from '../components/shortcut/PermissionIcon';
import CommentSection from '../components/shortcut/CommentSection';
import VersionPanel from '../components/shortcut/VersionPanel';
import ShortcutEditForm from '../components/shortcut/ShortcutEditForm';

export default function ShortcutDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast, confirm } = useToast();
  const [shortcut, setShortcut] = useState<Shortcut | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
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

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    api.getShortcut(id)
      .then(async (shortcutData) => {
        if (cancelled) return;
        const shortcut = shortcutData.shortcut;
        setShortcut(shortcut);
        const [versionData, similarData] = await Promise.all([
          api.getVersions(shortcut.id),
          api.getSimilar(shortcut.id),
        ]);
        if (cancelled) return;
        setVersions(versionData.versions);
        setSimilar(similarData.shortcuts);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (shortcut) {
      document.title = shortcut.title ? `${shortcut.title} - 捷径社区` : '捷径社区';
    }
    return () => { document.title = '捷径社区'; };
  }, [shortcut]);

  const handleLike = async () => {
    if (!user) {
      toast('请先登录后再点赞', 'info');
      return;
    }
    if (!shortcut || likeLoading) return;
    setLikeLoading(true);
    try {
      const data = await api.toggleLike(shortcut.id);
      setShortcut({ ...shortcut, liked: data.liked, like_count: data.like_count });
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!shortcut) return;
    if (!(await confirm('确定要下架该分享吗？'))) return;
    setActionLoading(true);
    try {
      await api.removeShortcut(shortcut.id);
      setShortcut({ ...shortcut, status: 'removed' });
    } catch (e: any) {
      console.error('下架失败', e);
      toast(e.message || '下架失败，请重试', 'error');
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
      toast(e.message || '恢复失败，请重试', 'error');
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
      toast(e.message || '统计刷新失败，请重试', 'error');
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
          <ShortcutEditForm
            editTitle={editTitle}
            editDescription={editDescription}
            editCategory={editCategory}
            editError={editError}
            editLoading={editLoading}
            onTitleChange={setEditTitle}
            onDescriptionChange={setEditDescription}
            onCategoryChange={setEditCategory}
            onSave={handleSaveEdit}
            onCancel={cancelEditing}
          />
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

      {showVersions && versions.length > 0 && (
        <VersionPanel versions={versions} />
      )}

      <CommentSection shortcutId={shortcut.id} status={shortcut.status} />

      <div className="lg:hidden mb-6">
        {similarSection}
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 py-6 max-w-[1600px] mx-auto">
      <div className="flex gap-6">
        {mainContent}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-20">
            {similarSection}
          </div>
        </div>
      </div>
    </div>
  );
}

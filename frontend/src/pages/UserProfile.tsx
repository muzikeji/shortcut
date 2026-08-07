import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import type { Shortcut } from './types';

interface UserProfile {
  id: number;
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  created_at: string;
  shortcut_count: number;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateUser, logout } = useAuth();
  const { toast, confirm } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUser && profile && currentUser.id === profile.id;
  const isOwnProfile = !!(currentUser && Number(id) === currentUser.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    const params: any = { userId: Number(id) };
    if (isOwnProfile && statusFilter) {
      params.status = statusFilter;
    } else if (isOwnProfile && !statusFilter) {
      params.includeRemoved = true;
    }
    if (search) params.search = search;
    Promise.all([
      api.getUser(Number(id)),
      api.getShortcuts(params),
    ])
      .then(([userData, shortcutData]) => {
        if (cancelled) return;
        if (isOwnProfile && currentUser) {
          userData.user.email = currentUser.email || userData.user.email;
        }
        setProfile(userData.user);
        setShortcuts(shortcutData.shortcuts);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, currentUser, isOwnProfile, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    return () => {
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
    };
  }, [editAvatarPreview]);

  const startEditing = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditEmail(profile.email || '');
    setEditBio(profile.bio || '');
    setEditAvatarFile(null);
    setEditAvatarPreview('');
    setSaveError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
    setEditAvatarFile(null);
    setEditAvatarPreview('');
    setSaveError('');
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast('头像图片不能超过 2MB', 'error');
      return;
    }
    setEditAvatarFile(file);
    setEditAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (editUsername.length < 2 || editUsername.length > 20) {
      setSaveError('用户名长度应为 2-20 个字符');
      return;
    }
    if (editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      setSaveError('邮箱格式不正确');
      return;
    }

    setSaveLoading(true);
    setSaveError('');

    try {
      const profileChanged =
        editUsername !== profile?.username ||
        editBio !== (profile?.bio || '') ||
        editEmail !== (profile?.email || '');

      if (profileChanged) {
        const body: Record<string, string> = {};
        if (editUsername !== profile?.username) body.username = editUsername;
        if (editBio !== (profile?.bio || '')) body.bio = editBio;
        if (editEmail !== (profile?.email || '')) body.email = editEmail;

        const data = await api.updateProfile(body);
        setProfile(prev => prev ? { ...prev, username: data.user.username, bio: data.user.bio, email: data.user.email } : null);
        updateUser({
          username: data.user.username,
          email: data.user.email,
        });
      }

      if (editAvatarFile) {
        const data = await api.uploadAvatar(editAvatarFile);
        setProfile(prev => prev ? { ...prev, avatar: data.user.avatar } : null);
        updateUser({ avatar: data.user.avatar });
      }

      setEditing(false);
      if (editAvatarPreview) URL.revokeObjectURL(editAvatarPreview);
      setEditAvatarFile(null);
      setEditAvatarPreview('');
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('新密码长度不能少于 6 位');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.updatePassword({ currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPassword(false);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">加载中...</div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-gray-400">用户不存在</div>;
  }

  const handleLike = async (sid: number) => {
    if (!currentUser) {
      toast('请先登录后再点赞', 'info');
      return;
    }
    try {
      const data = await api.toggleLike(sid);
      setShortcuts(prev =>
        prev.map(s => (s.id === sid ? { ...s, liked: data.liked, like_count: data.like_count } : s))
      );
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleRemoveShortcut = async (sid: number) => {
    if (!(await confirm('确定要下架该分享吗？'))) return;
    try {
      await api.removeShortcut(sid);
      setShortcuts(prev =>
        prev.map(s => (s.id === sid ? { ...s, status: 'removed' } : s))
      );
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleRestoreShortcut = async (sid: number) => {
    try {
      await api.restoreShortcut(sid);
      setShortcuts(prev =>
        prev.map(s => (s.id === sid ? { ...s, status: 'active' } : s))
      );
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleReeditShortcut = (slug: string) => {
    navigate(`/shortcut/${slug}`);
  };

  return (
    <div className="w-full px-4 py-6 max-w-[1600px] mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {(editing && editAvatarPreview) ? (
              <img src={editAvatarPreview} alt="preview" className="w-16 h-16 rounded-full object-cover" />
            ) : profile.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                {(editing ? editUsername : profile.username)?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {editing && (
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white text-xs"
              >
                更换
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              /* Edit Mode */
              <div className="space-y-3">
                {saveError && (
                  <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs">{saveError}</div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">昵称</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">个性签名</label>
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="写一句个性签名..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none max-w-sm"
                    rows={2}
                    maxLength={100}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="bg-blue-600 text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saveLoading ? '保存中...' : '保存'}
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
              /* View Mode */
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-800">{profile.username}</h1>
                </div>
                <p className="text-sm text-gray-400">
                  加入于 {new Date(profile.created_at).toLocaleDateString('zh-CN')} · {profile.shortcut_count} 个分享
                </p>
                {isOwner && profile.email && (
                  <p className="text-xs text-gray-400 mt-1">
                    {profile.email}
                  </p>
                )}
                <div className="mt-3">
                  {profile.bio ? (
                    <p className="text-gray-600 text-sm">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-300 text-sm italic">这个人很懒，什么都没写...</p>
                  )}
                </div>
                {isOwner && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={startEditing}
                      className="bg-white border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                    >
                      编辑资料
                    </button>
                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="bg-purple-50 border border-purple-200 text-purple-600 px-4 py-1.5 rounded-lg text-sm hover:bg-purple-100"
                      >
                        管理
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="border border-gray-300 text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                    >
                      退出
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Password Change Section (owner only, not in edit mode) */}
        {isOwner && !editing && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            {!showPassword ? (
              <button
                onClick={() => setShowPassword(true)}
                className="text-sm text-gray-500 hover:text-blue-600"
              >
                修改密码
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                <h4 className="text-sm font-medium text-gray-700">修改密码</h4>
                {passwordError && (
                  <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg text-xs">密码修改成功</div>
                )}
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="当前密码"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="新密码（至少 6 位）"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="确认新密码"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {passwordLoading ? '修改中...' : '确认修改'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword(false);
                      setPasswordError('');
                      setPasswordSuccess(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100"
                  >
                    取消
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Filter Bar */}
      {isOwnProfile && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {[
              { key: '', label: '全部' },
              { key: 'active', label: '分享中' },
              { key: 'pending', label: '待审核' },
              { key: 'removed', label: '已下架' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === f.key ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="搜索快捷指令..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* User's Shortcuts */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {profile.username} 分享的快捷指令 ({shortcuts.length})
      </h2>

      {shortcuts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {isOwner ? (
            <div>
              <p className="mb-3">
                {(() => {
                  if (search) return '没有找到匹配的快捷指令';
                  switch (statusFilter) {
                    case 'active': return '没有分享中的快捷指令';
                    case 'pending': return '没有待审核的快捷指令';
                    case 'removed': return '没有已下架的快捷指令';
                    default: return '你还没有分享过快捷指令';
                  }
                })()}
              </p>
              {!statusFilter && !search && (
                <Link to="/share" className="text-blue-600 hover:underline text-sm">
                  去分享第一个
                </Link>
              )}
            </div>
          ) : (
            <p>该用户还没有分享过快捷指令</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {shortcuts.map(s => {
            const theme = /^#[0-9a-fA-F]{6}$/.test(s.color || '') ? s.color : '#3B82F6';
            return (
            <div
              key={s.id}
              onClick={() => navigate(`/shortcut/${s.slug}`)}
              className="rounded-xl p-5 hover:shadow-lg transition-shadow cursor-pointer"
              style={{ backgroundColor: theme }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                    {s.category}
                  </span>
                  {s.status === 'pending' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      待审核
                    </span>
                  )}
                  {s.status === 'removed' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      已下架
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/60">
                  {new Date(s.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <h3 className="font-semibold text-white mb-1 line-clamp-1">
                {s.title}
              </h3>
              <p className="text-sm text-white/70 line-clamp-2 mb-4 min-h-[2.5rem]">
                {s.description || '暂无描述'}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">{s.download_count} 次下载</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLike(s.id); }}
                    className={`flex items-center gap-1 text-sm ${s.liked ? 'text-red-300' : 'text-white/60'} hover:text-red-300`}
                  >
                    <svg className="w-4 h-4" fill={s.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {s.like_count}
                  </button>
                  <Link
                    to={`/shortcut/${s.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-sm text-white/60 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {s.comment_count}
                  </Link>
                  <a
                    href={api.getDownloadUrl(s.id)}
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:underline"
                  >
                    获取
                  </a>
                  {isOwner && (
                    s.status === 'pending' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReeditShortcut(s.slug); }}
                        className="text-white/70 hover:text-white text-xs"
                      >
                        编辑
                      </button>
                    ) : s.status === 'removed' ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestoreShortcut(s.id); }}
                        className="text-white/70 hover:text-white text-xs"
                      >
                        恢复
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveShortcut(s.id); }}
                        className="text-white/70 hover:text-white text-xs"
                      >
                        下架
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

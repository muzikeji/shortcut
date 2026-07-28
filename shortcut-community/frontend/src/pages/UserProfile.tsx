import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { Shortcut } from './types';

interface UserProfile {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  created_at: string;
  shortcut_count: number;
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getUser(Number(id)),
      api.getShortcuts({ userId: Number(id) }),
    ])
      .then(([userData, shortcutData]) => {
        setProfile(userData.user);
        setShortcuts(shortcutData.shortcuts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const startEditing = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditBio(profile.bio || '');
    setEditAvatarFile(null);
    setEditAvatarPreview('');
    setSaveError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditAvatarFile(null);
    setEditAvatarPreview('');
    setSaveError('');
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('头像图片不能超过 2MB');
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

    setSaveLoading(true);
    setSaveError('');

    try {
      if (editUsername !== profile?.username || editBio !== (profile?.bio || '')) {
        const data = await api.updateProfile({
          username: editUsername !== profile?.username ? editUsername : undefined,
          bio: editBio !== (profile?.bio || '') ? editBio : undefined,
        });
        setProfile(prev => prev ? { ...prev, username: data.user.username, bio: data.user.bio } : null);
      }

      if (editAvatarFile) {
        const data = await api.uploadAvatar(editAvatarFile);
        setProfile(prev => prev ? { ...prev, avatar: data.user.avatar } : null);
      }

      setEditing(false);
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

  const categoryColors: Record<string, string> = {
    '效率': 'bg-blue-100 text-blue-700',
    '工具': 'bg-green-100 text-green-700',
    '娱乐': 'bg-purple-100 text-purple-700',
    '健康': 'bg-red-100 text-red-700',
    '学习': 'bg-yellow-100 text-yellow-700',
    '生活': 'bg-pink-100 text-pink-700',
    '其他': 'bg-gray-100 text-gray-600',
  };

  const handleLike = async (sid: number) => {
    if (!currentUser) {
      alert('请先登录后再点赞');
      return;
    }
    try {
      const data = await api.toggleLike(sid);
      setShortcuts(prev =>
        prev.map(s => (s.id === sid ? { ...s, liked: data.liked, like_count: data.like_count } : s))
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
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
                <div className="mt-3">
                  {profile.bio ? (
                    <p className="text-gray-600 text-sm">{profile.bio}</p>
                  ) : (
                    <p className="text-gray-300 text-sm italic">这个人很懒，什么都没写...</p>
                  )}
                </div>
                {isOwner && (
                  <button
                    onClick={startEditing}
                    className="mt-3 bg-white border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                  >
                    编辑资料
                  </button>
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

      {/* User's Shortcuts */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {profile.username} 分享的快捷指令 ({shortcuts.length})
      </h2>

      {shortcuts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {isOwner ? (
            <>
              <p className="mb-3">你还没有分享过快捷指令</p>
              <Link to="/share" className="text-blue-600 hover:underline text-sm">
                去分享第一个
              </Link>
            </>
          ) : (
            <p>该用户还没有分享过快捷指令</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortcuts.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[s.category] || categoryColors['其他']}`}>
                  {s.category}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <Link to={`/shortcut/${s.id}`}>
                <h3 className="font-semibold text-gray-800 mb-1 hover:text-blue-600 line-clamp-1">
                  {s.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                {s.description || '暂无描述'}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{s.download_count} 次下载</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(s.id)}
                    className={`flex items-center gap-1 text-sm ${s.liked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                  >
                    <svg className="w-4 h-4" fill={s.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {s.like_count}
                  </button>
                  <Link to={`/shortcut/${s.id}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-blue-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {s.comment_count}
                  </Link>
                  <a
                    href={api.getDownloadUrl(s.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:text-blue-800 font-medium"
                  >
                    获取
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

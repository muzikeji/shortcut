import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import type { AdminUser, Shortcut } from './types';
import { CATEGORY_COLORS } from './types';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'users' | 'shortcuts' | 'settings'>('users');

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        无权访问此页面
    </div>
  );
}

const SETTING_FIELDS: { key: string; label: string; placeholder: string; type: string; hint?: string }[] = [
  { key: 'siteName', label: '网站名称', placeholder: '捷径社区', type: 'text' },
  { key: 'siteDescription', label: '网站简介', placeholder: 'iOS 快捷指令分享社区', type: 'text' },
  { key: 'logoUrl', label: 'Logo 地址', placeholder: '/logo.png', type: 'text', hint: '可使用相对路径 /xxx.png 或完整 URL' },
  { key: 'icpBeian', label: 'ICP 备案号', placeholder: '粤ICP备XXXXXXXX号', type: 'text' },
  { key: 'seoTitle', label: '页面标题后缀', placeholder: '如：- 捷径社区', type: 'text', hint: '附加在页面标题末尾，如留空则不显示' },
  { key: 'seoDescription', label: 'SEO 描述', placeholder: '分享和发现实用的 iOS 快捷指令', type: 'text' },
];

function SiteSettings() {
  const { settings, setSettings } = useSettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const field of SETTING_FIELDS) {
      initial[field.key] = (settings as any)[field.key] || '';
    }
    setForm(initial);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await api.updateSettings(form);
      setSettings(updated);
      setSuccess('保存成功，页面已即时生效');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">站点配置</h2>
        <p className="text-xs text-gray-400 mb-5">修改名称、简介、Logo、备案及 SEO 信息，保存后全站即时生效。</p>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg text-xs">{success}</div>
          )}
          {SETTING_FIELDS.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={form[field.key] || ''}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.hint && (
                <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </form>
      </div>
    </div>
  );
}

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理后台</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
        {(['users', 'shortcuts', 'settings'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            {{ users: '用户管理', shortcuts: '分享管理', settings: '站点设置' }[t]}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UserManagement /> : tab === 'shortcuts' ? <ShortcutManagement /> : <SiteSettings />}
    </div>
  );
}

function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    api.adminGetUsers({ page, search: search || undefined })
      .then(data => {
        setUsers(data.users);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleBan = async (id: number) => {
    if (!confirm('确定要封禁该用户吗？封禁后该用户的所有分享将同时被下架。')) return;
    try {
      await api.adminBanUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: 1 } : u));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUnban = async (id: number) => {
    if (!confirm('确定要解封该用户吗？')) return;
    try {
      await api.adminUnbanUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: 0 } : u));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSetRole = async (id: number, role: 'admin' | 'user') => {
    const label = role === 'admin' ? '设为管理员' : '取消管理员';
    if (!confirm(`确定要${label}吗？`)) return;
    try {
      await api.adminSetRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (newUsername.length < 2 || newUsername.length > 20) {
      setCreateError('用户名长度应为 2-20 个字符');
      return;
    }
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setCreateError('请输入有效的邮箱地址');
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('密码长度不能少于 6 位');
      return;
    }

    setCreateLoading(true);
    try {
      await api.adminCreateUser({
        username: newUsername,
        email: newEmail,
        password: newPassword,
      });
      setCreateSuccess('管理员创建成功');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setPage(1);
      setSearch('');
      setSearchInput('');
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-400">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 shrink-0"
        >
          {showCreateForm ? '取消' : '新增管理员'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl border border-purple-200 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">新增管理员账号</h3>
          <form onSubmit={handleCreateAdmin} className="space-y-3">
            {createError && (
              <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs">{createError}</div>
            )}
            {createSuccess && (
              <div className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-xs">{createSuccess}</div>
            )}
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="用户名 (2-20字符)"
                className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={20}
                required
              />
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="邮箱"
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="密码 (至少6位)"
                className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={createLoading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {createLoading ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">用户</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">邮箱</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">角色</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">分享数</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">注册时间</th>
                <th className="text-right px-4 py-3 text-gray-500 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                          {u.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.shortcut_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.banned ? '已封禁' : '正常'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser && u.id !== currentUser.id && (
                        <button
                          onClick={() => handleSetRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                          className={`text-sm ${u.role === 'admin' ? 'text-orange-500 hover:text-orange-700' : 'text-purple-600 hover:text-purple-800'}`}
                        >
                          {u.role === 'admin' ? '取消管理员' : '设为管理员'}
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        u.banned ? (
                          <button
                            onClick={() => handleUnban(u.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            解封
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(u.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            封禁
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            {search ? '未找到匹配的用户' : '暂无用户'}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ShortcutManagement() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    setLoading(true);
    api.adminGetShortcuts({ page, status: statusFilter || undefined, search: search || undefined })
      .then(data => {
        setShortcuts(data.shortcuts);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleRemove = async (id: number) => {
    if (!confirm('确定要下架该分享吗？')) return;
    try {
      await api.removeShortcut(id);
      setShortcuts(prev => prev.map(s => s.id === id ? { ...s, status: 'removed' } : s));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.restoreShortcut(id);
      setShortcuts(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['', 'active', 'removed'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm ${statusFilter === s ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500'}`}
            >
              {s === '' ? '全部' : s === 'active' ? '正常' : '已下架'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索标题或作者..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">加载中...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">分享</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">作者</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">分类</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">状态</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">时间</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800 line-clamp-1 max-w-48">{s.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${(CATEGORY_COLORS[s.category] || CATEGORY_COLORS['其他']).bg} ${(CATEGORY_COLORS[s.category] || CATEGORY_COLORS['其他']).text}`}>
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'removed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {s.status === 'removed' ? '已下架' : '正常'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(s.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === 'removed' ? (
                        <button
                          onClick={() => handleRestore(s.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          恢复
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemove(s.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          下架
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shortcuts.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              {search ? '未找到匹配的分享' : '暂无数据'}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import { useToast } from '../../ToastContext';
import type { AdminUser } from '../../pages/types';

export default function UserManagement({ isOwner }: { isOwner: boolean }) {
  const { user: currentUser } = useAuth();
  const { toast, confirm } = useToast();
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
    if (!(await confirm('确定要封禁该用户吗？封禁后该用户的所有分享将同时被下架。'))) return;
    try {
      await api.adminBanUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: 1 } : u));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleUnban = async (id: number) => {
    if (!(await confirm('确定要解封该用户吗？'))) return;
    try {
      await api.adminUnbanUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, banned: 0 } : u));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleSetRole = async (id: number, role: 'owner' | 'admin' | 'user') => {
    const labels: Record<string, string> = { owner: '设为站长', admin: '设为管理员', user: '取消管理员/站长' };
    const label = labels[role] || '修改角色';
    if (!(await confirm(`确定要${label}吗？`))) return;
    try {
      await api.adminSetRole(id, role);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch (e: any) {
      toast(e.message, 'error');
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
        {isOwner && (
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 shrink-0"
        >
          {showCreateForm ? '取消' : '新增管理员'}
        </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl border border-purple-200 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">新增用户</h3>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'owner' ? 'bg-red-100 text-red-700' :
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role === 'owner' ? '站长' : u.role === 'admin' ? '管理员' : '用户'}
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
                      {currentUser && u.id !== currentUser.id && isOwner && (
                        <>
                          {u.role === 'owner' ? (
                            <button onClick={() => handleSetRole(u.id, 'user')} className="text-orange-500 hover:text-orange-700 text-sm">
                              取消站长
                            </button>
                          ) : u.role === 'admin' ? (
                            <>
                              <button onClick={() => handleSetRole(u.id, 'user')} className="text-orange-500 hover:text-orange-700 text-sm">
                                取消管理员
                              </button>
                              <button onClick={() => handleSetRole(u.id, 'owner')} className="text-red-500 hover:text-red-700 text-sm">
                                设为站长
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleSetRole(u.id, 'admin')} className="text-purple-600 hover:text-purple-800 text-sm">
                              设为管理员
                            </button>
                          )}
                        </>
                      )}
                      {u.role !== 'admin' && u.role !== 'owner' && (
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

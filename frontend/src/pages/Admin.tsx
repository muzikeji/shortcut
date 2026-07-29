import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import type { AdminUser, Shortcut } from './types';
import { CATEGORY_COLORS } from './types';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'users' | 'shortcuts'>('users');

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        无权访问此页面
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理后台</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
        >
          用户管理
        </button>
        <button
          onClick={() => setTab('shortcuts')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'shortcuts' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
        >
          分享管理
        </button>
      </div>

      {tab === 'users' ? <UserManagement /> : <ShortcutManagement />}
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.adminGetUsers({ page })
      .then(data => {
        setUsers(data.users);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

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

  if (loading) {
    return <div className="text-center py-10 text-gray-400">加载中...</div>;
  }

  return (
    <div>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

  useEffect(() => {
    setLoading(true);
    api.adminGetShortcuts({ page, status: statusFilter || undefined })
      .then(data => {
        setShortcuts(data.shortcuts);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

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
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">
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
            <div className="text-center py-10 text-gray-400">暂无数据</div>
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

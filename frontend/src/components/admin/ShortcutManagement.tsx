import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useToast } from '../../ToastContext';
import type { Shortcut } from '../../pages/types';
import { CATEGORY_COLORS } from '../../pages/types';

export default function ShortcutManagement() {
  const { toast, confirm } = useToast();
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
    if (!(await confirm('确定要下架该分享吗？'))) return;
    try {
      await api.removeShortcut(id);
      setShortcuts(prev => prev.map(s => s.id === id ? { ...s, status: 'removed' } : s));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await api.restoreShortcut(id);
      setShortcuts(prev => prev.map(s => s.id === id ? { ...s, status: 'active' } : s));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm('确定要永久删除该分享吗？此操作不可撤销。'))) return;
    try {
      await api.adminDeleteShortcut(id);
      setShortcuts(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      toast(e.message, 'error');
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
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => handleRestore(s.id)}
                            className="text-green-600 hover:text-green-800 text-sm px-1"
                          >
                            恢复
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-red-500 hover:text-red-700 text-sm px-1"
                          >
                            删除
                          </button>
                        </div>
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

import { useState, useEffect } from 'react';
import { api } from '../../api';
import type { Shortcut } from '../../pages/types';

export default function PendingReview() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchData = async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminGetPendingShortcuts({ page: p });
      setShortcuts(data.shortcuts);
      setTotalPages(data.totalPages);
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    setError('');
    try {
      await api.adminApproveShortcut(id);
      setShortcuts(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionId(id);
    setError('');
    try {
      await api.adminRejectShortcut(id);
      setShortcuts(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      setError(e.message || '操作失败');
    } finally {
      setActionId(null);
    }
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = { '工具': '#3b82f6', '娱乐': '#8b5cf6', '效率': '#10b981', '视频': '#ef4444', '音乐': '#f59e0b', '阅读': '#6366f1', '生活': '#14b8a6', '社交': '#ec4899', '图片': '#f97316', '开发者': '#84cc16', '资讯': '#06b6d4' };
    return colors[cat] || '#6b7280';
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">待审核投稿</h2>
            <p className="text-xs text-gray-400 mt-0.5">用户发布后需在此审核通过才会公开显示</p>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">{error}</div>
        )}

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">加载中...</div>
        ) : shortcuts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">暂无待审核投稿</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {shortcuts.map(s => (
              <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: s.color || getCategoryColor(s.category) }}
                >
                  {(s.title || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm truncate">{s.title || '未命名'}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: getCategoryColor(s.category) + '20', color: getCategoryColor(s.category) }}
                    >
                      {s.category || '其他'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{s.description || '-'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    作者: {s.username || '-'} | {s.created_at ? new Date(s.created_at).toLocaleString('zh-CN') : '-'}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(s.id)}
                    disabled={actionId === s.id}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionId === s.id ? '...' : '通过'}
                  </button>
                  <button
                    onClick={() => handleReject(s.id)}
                    disabled={actionId === s.id}
                    className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 disabled:opacity-50"
                  >
                    {actionId === s.id ? '...' : '驳回'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-xs rounded-md border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-xs text-gray-400">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 text-xs rounded-md border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

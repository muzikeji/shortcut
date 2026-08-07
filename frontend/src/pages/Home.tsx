import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import type { Shortcut } from './types';

export default function Home() {  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getShortcuts({ page, search, sort })
      .then(data => {
        if (cancelled) return;
        setShortcuts(data.shortcuts);
        setTotalPages(data.totalPages);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, sort]);

  const handleLike = async (id: number) => {
    if (!user) {
      toast('请先登录后再点赞', 'info');
      return;
    }
    try {
      const data = await api.toggleLike(id);
      setShortcuts(prev =>
        prev.map(s => (s.id === id ? { ...s, liked: data.liked, like_count: data.like_count } : s))
      );
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="w-full px-4 py-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          {search ? `搜索: "${search}"` : '最新快捷指令'}
        </h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['latest', 'likes', 'downloads'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1 rounded-md text-sm ${sort === s ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500'}`}
            >
              {s === 'latest' ? '最新' : s === 'likes' ? '最热' : '最多下载'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : shortcuts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? '没有找到相关快捷指令' : '还没有人分享快捷指令'}
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
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}
                >
                  {s.category}
                </span>
                <span className="text-xs text-white/60">
                  {new Date(s.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>

              <h2 className="font-semibold text-white mb-1 line-clamp-1">
                {s.title}
              </h2>
              <p className="text-sm text-white/70 line-clamp-2 mb-4 min-h-[2.5rem]">
                {s.description || '暂无描述'}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-white/60">
                  {s.avatar ? (
                    <img src={s.avatar} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: theme }}>
                      {s.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <Link
                    to={`/user/${s.user_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-white/60 hover:text-white hover:underline"
                  >{s.username}</Link>
                  <span>{s.download_count} 次下载</span>
                </div>
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
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-8">
          {(() => {
            const pages: (number | string)[] = [];
            const maxShow = 7;
            if (totalPages <= maxShow) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else {
              pages.push(1);
              if (page > 2) pages.push('...');
              for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
              if (page < totalPages - 1) pages.push('...');
              pages.push(totalPages);
            }
            return pages.map((p, i) =>
              typeof p === 'string' ? <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400">...</span> :
              (<button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >{p}</button>)
            );
          })()}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(search)}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-blue-600 shrink-0">
          <img src="/logo.png" alt="捷径社区" className="w-7 h-7 rounded" />
          <span className="hidden sm:inline">捷径社区</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="搜索快捷指令..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <Link
                to="/share"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                发布
              </Link>
              <Link
                to={`/user/${user.id}`}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="hidden sm:inline font-medium">{user.username}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

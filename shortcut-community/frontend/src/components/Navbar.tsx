import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
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
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
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
                分享
              </Link>
              <span className="text-sm text-gray-600 hidden sm:inline">{user.username}</span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                退出
              </button>
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

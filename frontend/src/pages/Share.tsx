import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['效率', '工具', '娱乐', '健康', '学习', '生活', '其他'];
const ICLOUD_REGEX = /^https?:\/\/(www\.)?icloud\.com\/shortcuts\/[a-zA-Z0-9]+$/i;

export default function Share() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('其他');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const isValidUrl = (value: string) => ICLOUD_REGEX.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入快捷指令名称');
      return;
    }
    if (!url.trim()) {
      setError('请提供 iCloud 快捷指令链接');
      return;
    }
    if (!isValidUrl(url.trim())) {
      setError('请输入有效的 iCloud 快捷指令链接 (https://www.icloud.com/shortcuts/xxx)');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createShortcut({
        title: title.trim(),
        description: description.trim(),
        category,
        url: url.trim(),
      });
      navigate(`/shortcut/${data.shortcut.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const urlError = url && !isValidUrl(url) ? '链接格式不正确' : '';

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">分享快捷指令</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="给你的快捷指令取个名字"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="描述这个快捷指令的功能和使用方法"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-sm border ${category === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">iCloud 链接 *</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.icloud.com/shortcuts/xxxxxxxx"
            className={`w-full px-3 py-2 rounded-lg border outline-none ${urlError ? 'border-red-400 focus:ring-2 focus:ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
            required
          />
          {urlError && (
            <p className="text-red-500 text-xs mt-1">{urlError}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            在 iOS 快捷指令 App 中分享快捷指令，选择"拷贝 iCloud 链接"，然后粘贴到此处
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '发布中...' : '发布快捷指令'}
        </button>
      </form>
    </div>
  );
}

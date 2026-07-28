import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['效率', '工具', '娱乐', '健康', '学习', '生活', '其他'];

export default function Share() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('其他');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('请输入快捷指令名称');
      return;
    }
    if (!file) {
      setError('请选择快捷指令文件');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('file', file);

      const data = await api.createShortcut(formData);
      navigate(`/shortcut/${data.shortcut.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <label className="block text-sm font-medium text-gray-700 mb-1">文件 *</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".shortcut,.plist,.xml"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {file ? (
              <div className="text-sm">
                <p className="text-blue-600 font-medium">{file.name}</p>
                <p className="text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-400">点击选择快捷指令文件</p>
                <p className="text-xs text-gray-300 mt-1">支持 .shortcut 格式，最大 10MB</p>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '上传中...' : '发布快捷指令'}
        </button>
      </form>
    </div>
  );
}

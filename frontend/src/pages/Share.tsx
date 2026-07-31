import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const CATEGORIES = ['效率', '工具', '娱乐', '健康', '学习', '生活', '其他'];
const ICLOUD_REGEX = /^https?:\/\/(www\.)?icloud\.com\/shortcuts\/[a-zA-Z0-9]+$/i;

function formatNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function generateSlug() {
  return String(Math.floor(Date.now() / 1000));
}

function extractShortcutId(url: string) {
  const m = url.match(/icloud\.com\/shortcuts\/([a-zA-Z0-9]+)/i);
  return m ? m[1] : '';
}

export default function Share() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('其他');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(generateSlug());
  const [publishedAt, setPublishedAt] = useState(formatNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setPublishedAt(formatNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const commentText = () =>
    `发布者：${user?.username || ''}\n来源：捷径源©版权归作者所有\n发布时间：${publishedAt}\n作品地址：${window.location.origin}/shortcut/${slug}`;

  const handleCopyComment = async () => {
    const text = commentText();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError('复制失败，请手动选择文本复制');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const isValidUrl = (value: string) => ICLOUD_REGEX.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('请提供 iCloud 快捷指令链接');
      return;
    }
    if (!isValidUrl(url.trim())) {
      setError('请输入有效的 iCloud 快捷指令链接 (https://www.icloud.com/shortcuts/xxx)');
      return;
    }

    const autoTitle = extractShortcutId(url.trim());
    if (!autoTitle) {
      setError('无法从链接中识别快捷指令名称，请检查链接');
      return;
    }

    setLoading(true);
    try {
      const data = await api.createShortcut({
        title: autoTitle,
        description: description.trim(),
        category,
        url: url.trim(),
        slug,
      });
      navigate(`/shortcut/${data.shortcut.slug}`);
    } catch (err: any) {
      setError(err.message);
      if (/标识已被使用|重复/i.test(err.message)) {
        setSlug(generateSlug());
      }
    } finally {
      setLoading(false);
    }
  };

  const urlError = url && !isValidUrl(url) ? '链接格式不正确' : '';

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">发布快捷指令</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        {/* 注释建议 */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-blue-700">建议</span>
          </div>
          <p className="text-xs text-blue-600 mb-3 leading-relaxed">
            发布前建议在快捷指令最上方添加一个「注释」动作，注明发布者与版权信息。下方作品地址已按当前时间戳生成并固定，点击复制按钮即可粘贴到快捷指令的「注释」动作中。
          </p>

          <div className="bg-white rounded-lg border border-blue-100 p-3 mb-3 font-mono text-xs text-gray-700 whitespace-pre-line">
            {commentText()}
          </div>

          <button
            type="button"
            onClick={handleCopyComment}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {copied ? '已复制 ✓' : '复制注释内容'}
          </button>
          <p className="text-[10px] text-blue-400 mt-2 text-center">
            作品地址已按当前时间戳生成并固定，发布时间随当前时间每秒更新，发布后地址与发布时间保持不变
          </p>
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

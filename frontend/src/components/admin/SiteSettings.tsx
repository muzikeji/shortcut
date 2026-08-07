import { useState, useEffect } from 'react';
import { api } from '../../api';
import { useSettings } from '../../SettingsContext';

const SETTING_FIELDS: { key: string; label: string; placeholder: string; type: string; hint?: string }[] = [
  { key: 'siteName', label: '网站名称', placeholder: '捷径社区', type: 'text' },
  { key: 'siteDescription', label: '网站简介', placeholder: 'iOS 快捷指令分享社区', type: 'text' },
  { key: 'logoUrl', label: 'Logo 地址', placeholder: '/logo.png', type: 'text', hint: '可使用相对路径 /xxx.png 或完整 URL' },
  { key: 'icpBeian', label: 'ICP 备案号', placeholder: '粤ICP备XXXXXXXX号', type: 'text' },
  { key: 'seoTitle', label: '页面标题后缀', placeholder: '如：- 捷径社区', type: 'text', hint: '附加在页面标题末尾，如留空则不显示' },
  { key: 'seoDescription', label: 'SEO 描述', placeholder: '分享和发现实用的 iOS 快捷指令', type: 'text' },
  { key: 'wechatBotToken', label: '企业微信 Bot Token', placeholder: '企业微信机器人 Webhook key', type: 'text', hint: '从群机器人设置页面获取 key 值，填后新投稿会推送到群消息' },
];

export default function SiteSettings() {
  const { settings, setSettings } = useSettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const field of SETTING_FIELDS) {
      initial[field.key] = (settings as any)[field.key] || '';
    }
    setForm(initial);
  }, [settings]);

  useEffect(() => {
    api.getAdminSettings().then(data => {
      for (const field of SETTING_FIELDS) {
        if ((data as any)[field.key]) {
          setForm(prev => ({ ...prev, [field.key]: (data as any)[field.key] }));
        }
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await api.updateSettings(form);
      setSettings(updated);
      setSuccess('保存成功，页面已即时生效');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">站点配置</h2>
        <p className="text-xs text-gray-400 mb-5">修改名称、简介、Logo、备案及 SEO 信息，保存后全站即时生效。</p>
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg text-xs">{success}</div>
          )}
          {SETTING_FIELDS.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={form[field.key] || ''}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              {field.hint && (
                <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </form>
      </div>
    </div>
  );
}

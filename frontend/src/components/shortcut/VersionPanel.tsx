import type { ShortcutVersion } from '../../pages/types';

interface VersionPanelProps {
  versions: ShortcutVersion[];
}

export default function VersionPanel({ versions }: VersionPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">版本记录</h3>
      <div className="space-y-3">
        {versions.map((v, i) => (
          <div key={v.id} className={`flex gap-3 ${i < versions.length - 1 ? 'pb-3 border-b border-gray-100' : ''}`}>
            <div className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(v.created_at).toLocaleString('zh-CN')}
                </span>
                {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700">当前</span>}
              </div>
              {v.version_note && (
                <p className="text-sm text-gray-600 mt-1">{v.version_note}</p>
              )}
              <p className="text-xs text-gray-400 mt-1 truncate">{v.url}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

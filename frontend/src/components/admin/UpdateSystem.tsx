import { useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../ToastContext';

export default function UpdateSystem() {
  const { confirm } = useToast();
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [info, setInfo] = useState<{ current: string; latest: string; published: string; hasUpdate: boolean; size: number } | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const check = async () => {
    setChecking(true);
    setErr('');
    setMsg('');
    try {
      const data = await api.checkUpdate();
      setInfo(data);
      if (data.hasUpdate) {
        setMsg(`发现新版本 ${data.latest}，当前版本 ${data.current}`);
      } else {
        setMsg('已是最新版本');
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setChecking(false);
    }
  };

  const runUpdate = async () => {
    if (!(await confirm('升级将覆盖除 data/ 和 uploads/ 外的所有文件。是否继续？'))) return;
    setUpdating(true);
    setErr('');
    setMsg('');
    setLog([]);
    try {
      setMsg('正在下载更新包...');
      const download = await api.runUpdate();
      setLog(l => [...l, download.message]);
      setMsg('正在安装更新...');
      const data = await api.installUpdate();
      setMsg(data.message);
      if (data.from) setLog(l => [...l, `版本: ${data.from} → ${data.version}`]);
      if (data.backup) setLog(l => [...l, data.backup]);
      if (data.note) setLog(l => [...l, data.note]);
      if (data.errors && data.errors.length > 0) {
        setLog(l => [...l, `错误: ${data.errors.join(', ')}`]);
        setErr('部分文件更新失败，请检查上方日志');
      }
      setInfo(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">系统升级</h2>
        <p className="text-xs text-gray-400 mb-5">通过 GitHub Release 在线升级到最新版本。</p>

        {err && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs mb-3">{err}</div>}
        {msg && <div className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-xs mb-3">{msg}</div>}

        <div className="flex gap-3 mb-4">
          <button
            onClick={check}
            disabled={checking}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {checking ? '检查中...' : '检查更新'}
          </button>
          {info?.hasUpdate && (
            <button
              onClick={runUpdate}
              disabled={updating}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {updating ? '升级中...' : '立即升级'}
            </button>
          )}
        </div>

        {info && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <div className="flex gap-2">
              <span className="text-gray-400">当前版本:</span>
              <span className="text-gray-700 font-mono">{info.current}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">最新版本:</span>
              <span className="text-gray-700 font-mono">{info.latest}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400">发布时间:</span>
              <span className="text-gray-600">{info.published ? new Date(info.published).toLocaleString('zh-CN') : '-'}</span>
            </div>
            {info.size > 0 && (
              <div className="flex gap-2">
                <span className="text-gray-400">包大小:</span>
                <span className="text-gray-600">{(info.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4 mt-4 text-xs text-green-700 space-y-1">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

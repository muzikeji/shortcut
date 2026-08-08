import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';
import SiteSettings from '../components/admin/SiteSettings';
import PendingReview from '../components/admin/PendingReview';
import UserManagement from '../components/admin/UserManagement';
import ShortcutManagement from '../components/admin/ShortcutManagement';
import UpdateSystem from '../components/admin/UpdateSystem';

export default function Admin() {
  const { user } = useAuth();
  useToast();
  const [tab, setTab] = useState<'users' | 'pending' | 'shortcuts' | 'settings' | 'update'>('users');
  const isOwner = user?.role === 'owner';

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-400">
        无权访问此页面
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理后台</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 mb-6 w-fit">
        {(isOwner ? (['users', 'pending', 'shortcuts', 'settings', 'update'] as const) : (['users', 'pending', 'shortcuts'] as const)).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === t ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            {{ users: '用户管理', pending: '待审核', shortcuts: '分享管理', settings: '站点设置', update: '系统升级' }[t]}
          </button>
        ))}
      </div>

      {tab === 'users' ? <UserManagement isOwner={isOwner} /> : tab === 'pending' ? <PendingReview /> : tab === 'shortcuts' ? <ShortcutManagement /> : tab === 'settings' && isOwner ? <SiteSettings /> : tab === 'update' && isOwner ? <UpdateSystem /> : null}
    </div>
  );
}

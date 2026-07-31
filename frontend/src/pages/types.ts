export interface Shortcut {
  id: number;
  slug: string;
  color: string;
  stats: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  download_count: number;
  like_count: number;
  comment_count: number;
  user_id: number;
  username: string;
  avatar: string;
  liked: boolean;
  status: string;
  created_at: string;
}

export interface ShortcutVersion {
  id: number;
  shortcut_id: number;
  url: string;
  version_note: string;
  created_at: string;
}

export interface Comment {
  id: number;
  shortcut_id: number;
  user_id: number;
  username: string;
  avatar: string;
  content: string;
  parent_id: number | null;
  replies?: Comment[];
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  role: string;
  banned: number;
  shortcut_count: number;
  created_at: string;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; light: string; accent: string }> = {
  '效率': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', light: 'bg-blue-50', accent: 'blue' },
  '工具': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', light: 'bg-green-50', accent: 'green' },
  '娱乐': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', light: 'bg-purple-50', accent: 'purple' },
  '健康': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', light: 'bg-red-50', accent: 'red' },
  '学习': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', light: 'bg-yellow-50', accent: 'yellow' },
  '生活': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', light: 'bg-pink-50', accent: 'pink' },
  '其他': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', light: 'bg-gray-50', accent: 'gray' },
};

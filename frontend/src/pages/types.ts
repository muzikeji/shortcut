export interface Shortcut {
  id: number;
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

export interface Comment {
  id: number;
  shortcut_id: number;
  user_id: number;
  username: string;
  avatar: string;
  content: string;
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

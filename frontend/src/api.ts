const API = '/api';

async function request(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
}

export const api = {
  // Auth
  register: (body: { username: string; email: string; password: string }) =>
    request('/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  login: (body: { username: string; password: string }) =>
    request('/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  getMe: () => request('/users/me'),
  getUser: (id: number) => request(`/users/${id}`),
  updateProfile: (body: { bio?: string; username?: string; email?: string }) =>
    request('/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  updatePassword: (body: { currentPassword: string; newPassword: string }) =>
    request('/users/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return request('/users/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  // Shortcuts
  getShortcuts: (params: {
    page?: number;
    search?: string;
    sort?: string;
    userId?: number;
    includeRemoved?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
    if (params.userId) query.set('userId', String(params.userId));
    if (params.includeRemoved) query.set('includeRemoved', '1');
    return request(`/shortcuts?${query.toString()}`);
  },
  getShortcut: (id: number) => request(`/shortcuts/${id}`),
  createShortcut: (body: { title: string; description: string; category: string; url: string }) =>
    request('/shortcuts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deleteShortcut: (id: number) =>
    request(`/shortcuts/${id}`, { method: 'DELETE' }),
  updateShortcut: (id: number, body: { title: string; description?: string; category?: string }) =>
    request(`/shortcuts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  removeShortcut: (id: number) =>
    request(`/shortcuts/${id}/remove`, { method: 'PUT' }),
  restoreShortcut: (id: number) =>
    request(`/shortcuts/${id}/restore`, { method: 'PUT' }),
  getDownloadUrl: (id: number) => `${API}/shortcuts/${id}/download`,

  getVersions: (shortcutId: number) => request(`/shortcuts/${shortcutId}/versions`),
  addVersion: (shortcutId: number, body: { url: string; version_note: string }) =>
    request(`/shortcuts/${shortcutId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  getSimilar: (shortcutId: number) => request(`/shortcuts/${shortcutId}/similar`),

  // Likes & Comments
  toggleLike: (shortcutId: number) =>
    request(`/shortcuts/${shortcutId}/like`, { method: 'POST' }),
  getComments: (shortcutId: number) =>
    request(`/shortcuts/${shortcutId}/comments`),
  addComment: (shortcutId: number, content: string) =>
    request(`/shortcuts/${shortcutId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),
  deleteComment: (shortcutId: number, commentId: number) =>
    request(`/shortcuts/${shortcutId}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Admin
  adminGetUsers: (params: { page?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    return request(`/admin/users?${query.toString()}`);
  },
  adminCreateUser: (body: { username: string; email: string; password: string }) =>
    request('/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  adminSetRole: (id: number, role: 'admin' | 'user') =>
    request(`/admin/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }),
  adminBanUser: (id: number) =>
    request(`/admin/users/${id}/ban`, { method: 'PUT' }),
  adminUnbanUser: (id: number) =>
    request(`/admin/users/${id}/unban`, { method: 'PUT' }),
  adminGetShortcuts: (params: { page?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return request(`/admin/shortcuts?${query.toString()}`);
  },
};

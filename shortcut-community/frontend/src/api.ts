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

  // Shortcuts
  getShortcuts: (params: {
    page?: number;
    search?: string;
    sort?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);
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
  getDownloadUrl: (id: number) => `${API}/shortcuts/${id}/download`,

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
};

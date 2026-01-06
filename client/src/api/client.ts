const API_BASE = '/api';

export interface Version {
  id: number;
  filename: string;
  original_name: string;
  extracted_text?: string;
  memo: string | null;
  created_at: string;
}

export interface DiffChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface DiffResult {
  version1: { id: number; original_name: string; created_at: string };
  version2: { id: number; original_name: string; created_at: string };
  diff: {
    changes: DiffChange[];
    stats: { additions: number; deletions: number; unchanged: number };
  };
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  auth: {
    login: (password: string) =>
      fetchApi<{ success: boolean }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }),
    check: () => fetchApi<{ authenticated: boolean }>('/auth/check'),
    logout: () => fetchApi<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  },

  versions: {
    list: () => fetchApi<Version[]>('/versions'),
    get: (id: number) => fetchApi<Version>(`/versions/${id}`),
    updateMemo: (id: number, memo: string) =>
      fetchApi<{ success: boolean }>(`/versions/${id}/memo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo }),
      }),
    delete: (id: number) =>
      fetchApi<{ success: boolean }>(`/versions/${id}`, { method: 'DELETE' }),
    getPdfUrl: (id: number) => `${API_BASE}/versions/${id}/pdf`,
  },

  upload: async (file: File, memo?: string) => {
    const formData = new FormData();
    formData.append('pdf', file);
    if (memo) formData.append('memo', memo);

    return fetchApi<{ id: number; filename: string; message: string }>('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  diff: (id1: number, id2: number) => fetchApi<DiffResult>(`/diff/${id1}/${id2}`),
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface RequestOptions {
  method?: string;
  body?: any;
  isMultipart?: boolean;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, isMultipart = false } = options;
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isMultipart ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (body: any) => request('/api/auth/login', { method: 'POST', body }),
  signup: (body: any) => request('/api/auth/signup', { method: 'POST', body }),

  // Projects
  getProjects: () => request('/api/projects'),
  createProject: (body: any) => request('/api/projects', { method: 'POST', body }),
  deleteProject: (id: string) => request(`/api/projects/${id}`, { method: 'DELETE' }),

  // Documents
  uploadDocument: (file: File, projectId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    return request('/api/documents/upload', {
      method: 'POST',
      body: formData,
      isMultipart: true,
    });
  },
  getDocuments: () => request('/api/documents/'),

  // Analysis
  analyzeDocument: (body: any) => request('/api/analyze', { method: 'POST', body }),
  analyzeMulti: (body: any) => request('/api/analyze/multi', { method: 'POST', body }),
  getFrameworks: () => request('/api/frameworks'),
  getAnalyses: () => request('/api/analyses'),
  getAdminStats: () => request('/api/admin/stats'),
  upsertFramework: (body: any) => request('/api/admin/frameworks', { method: 'POST', body }),
  reindexFramework: (body: any) => request('/api/admin/reindex', { method: 'POST', body }),

  // Search
  searchRegistry: (q: string, regulation: string) => 
    request(`/api/search?q=${encodeURIComponent(q)}&regulation=${encodeURIComponent(regulation)}`),

  // LLM
  rewriteClause: (body: any) => {
    const provider = localStorage.getItem('llmProvider') || 'groq';
    const model = localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile';
    return request('/api/rewrite', {
      method: 'POST',
      body: { ...body, provider, model }
    });
  },
  chatWithAssistant: (body: any) => {
    const provider = localStorage.getItem('llmProvider') || 'groq';
    const model = localStorage.getItem('groqModel') || 'llama-3.3-70b-versatile';
    return request('/api/chat', {
      method: 'POST',
      body: { ...body, provider, model }
    });
  },
};

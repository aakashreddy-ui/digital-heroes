import { ApiResponse } from '../../../shared/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

class ApiError extends Error {
  errorCode: string;
  constructor(message: string, errorCode: string = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('dh_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {  
    throw new ApiError(response.statusText || 'Network request failed');
  }

  if (!json.success) {
    throw new ApiError(json.message || 'An error occurred', json.errorCode);
  }

  return json.data as T;
}

export const api = {
  // Auth
  auth: {
    signup: (data: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  },

  // Scores
  scores: {
    getAll: () => request('/scores'),
    add: (data: any) => request('/scores', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/scores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/scores/${id}`, { method: 'DELETE' }),
  },

  // Charities
  charities: {
    getAll: (params?: { category?: string; search?: string; featured?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.search) qs.set('search', params.search);
      if (params?.featured) qs.set('featured', 'true');
      return request(`/charities?${qs.toString()}`);
    },
    getById: (id: string) => request(`/charities/${id}`),
    getUserSelection: () => request('/charities/user/selection'),
    setUserSelection: (data: { charity_id: string; contribution_percentage: number }) =>
      request('/charities/user/selection', { method: 'POST', body: JSON.stringify(data) }),
    // Admin
    create: (data: any) => request('/charities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request(`/charities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/charities/${id}`, { method: 'DELETE' }),
  },

  // Subscriptions
  subscription: {
    getPlans: () => request('/subscription/plans'),
    getCurrent: () => request('/subscription'),
    createCheckout: (plan_id: string, success_url?: string, cancel_url?: string) =>
      request('/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id, success_url, cancel_url }),
      }),
    cancel: (immediate: boolean = false) =>
      request('/subscription/cancel', { method: 'POST', body: JSON.stringify({ immediate }) }),
    activateTest: (plan_id: string) =>
      request('/subscription/activate-test', { method: 'POST', body: JSON.stringify({ plan_id }) }),
  },

  // Draws
  draws: {
    getUpcoming: () => request('/draws/upcoming'),
    getLatest: () => request('/draws/latest'),
    getAll: () => request('/draws'),
    getById: (id: string) => request(`/draws/${id}`),
    getUserEntries: () => request('/draws/user/entries'),
    // Admin
    create: (data: any) => request('/draws', { method: 'POST', body: JSON.stringify(data) }),
    simulate: (id: string, data: { method?: string; custom_numbers?: number[] }) =>
      request(`/draws/${id}/simulate`, { method: 'POST', body: JSON.stringify(data) }),
    publish: (id: string) => request(`/draws/${id}/publish`, { method: 'POST' }),
  },

  // Winners
  winners: {
    getUserWinnings: () => request('/winners/user'),
    getById: (id: string) => request(`/winners/${id}`),
    uploadProof: (id: string, formData: FormData) =>
      request(`/winners/${id}/proof`, { method: 'POST', body: formData }),
    uploadProofUrl: (id: string, proof_url: string, file_name?: string) =>
      request(`/winners/${id}/proof`, {
        method: 'POST',
        body: JSON.stringify({ proof_url, file_name }),
      }),
    // Admin
    adminGetAll: (params?: { verification_status?: string; payout_status?: string; draw_id?: string }) => {
      const qs = new URLSearchParams();
      if (params?.verification_status) qs.set('verification_status', params.verification_status);
      if (params?.payout_status) qs.set('payout_status', params.payout_status);
      if (params?.draw_id) qs.set('draw_id', params.draw_id);
      return request(`/winners/admin/all?${qs.toString()}`);
    },
    adminVerify: (id: string, approved: boolean, notes?: string) =>
      request(`/winners/admin/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approved, notes }),
      }),
    adminPayout: (id: string, payout_reference?: string) =>
      request(`/winners/admin/${id}/payout`, {
        method: 'POST',
        body: JSON.stringify({ payout_reference }),
      }),
  },

  // Donations (independent)
  donations: {
    create: (data: any) => request('/donations', { method: 'POST', body: JSON.stringify(data) }),
    getUserDonations: () => request('/donations/user'),
    getAll: () => request('/donations'),
  },

  // Admin
  admin: {
    getUsers: (params?: { role?: string; search?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.role) qs.set('role', params.role);
      if (params?.search) qs.set('search', params.search);
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      return request(`/admin/users?${qs.toString()}`);
    },
    updateUser: (id: string, data: any) =>
      request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getUserScores: (id: string) => request(`/admin/users/${id}/scores`),
    updateScore: (id: string, data: any) =>
      request(`/admin/scores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getSubscriptions: (params?: { status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      return request(`/admin/subscriptions?${qs.toString()}`);
    },
    getAnalytics: () => request('/admin/analytics'),
  },
};

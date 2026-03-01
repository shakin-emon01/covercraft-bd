import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});
type Payload = Record<string, unknown>;

API.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('covercraft-auth');
    const parsed = stored ? JSON.parse(stored) : null;
    const token = parsed?.state?.token || parsed?.token || null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    return config;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || '');
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const isAuthAction =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google');
    const isPublicRoute = path === '/login' || path === '/register';

    if (status === 401 && !isAuthAction) {
      localStorage.removeItem('covercraft-auth');

      if (typeof window !== 'undefined' && !isPublicRoute) {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export const registerUser = (data: Payload) => API.post('/auth/register', data);

export const loginUser = (data: Payload) => API.post('/auth/login', data);

export const googleAuth = (data: Payload) => API.post('/auth/google', data);

export const getMe = () => API.get('/auth/me');

export const getUniversities = () => API.get('/universities');
export const getProfile = () => API.get('/profile');
export const upsertProfile = (data: Payload) => API.put('/profile', data);

export const getTemplates = () => API.get('/templates');
export const getCovers = () => API.get('/covers');
export const createCover = (data: Payload) => API.post('/covers', data);
export const generateCover = (data: Payload) => API.post('/covers/generate', data);
export const deleteCover = (id: string) => API.delete(`/covers/${id}`);

// Public API for shared covers
export const getSharedCover = (id: string) => API.get(`/covers/shared/${id}`);

// Batch cover generation (returns ZIP file as blob)
export const generateBatchCovers = (data: Payload) => API.post('/covers/batch', data, { responseType: 'blob' });

export const requestUniLogo = (id: string, formData: FormData) => API.post(`/universities/${id}/logo-request`, formData);
export const getAdminStats = () => API.get('/admin/stats');
export const getAllUsers = () => API.get('/admin/users');
export const getPendingLogos = () => API.get('/admin/logo-requests');
export const resolveLogo = (id: string, action: 'APPROVE' | 'REJECT') => API.post(`/admin/logo-requests/${id}/resolve`, { action });
export const resolveLogoBulk = (data: Payload) => API.post('/admin/logo-requests/bulk-resolve', data);
export const deleteUser = (id: string) => API.delete(`/admin/users/${id}`);
export const getAdminUnis = () => API.get('/admin/universities');
export const addUni = (data: Payload) => API.post('/admin/universities', data);
export const updateUni = (id: string, data: Payload) => API.put(`/admin/universities/${id}`, data);
export const deleteUni = (id: string) => API.delete(`/admin/universities/${id}`);
export const getTemplateAnalytics = () => API.get('/admin/analytics/templates');
export const getTemplatePerformanceAnalytics = () => API.get('/admin/analytics/templates/performance');
export const updateBroadcast = (data: Payload) => API.post('/admin/broadcast', data);
export const getActiveBroadcast = () => API.get('/system/broadcast');

// Admin premium modules
export const getAuditLogs = (take = 50) => API.get(`/admin/audit-logs?take=${take}`);
export const getRoleMatrix = () => API.get('/admin/role-matrix');
export const updateUserAccess = (id: string, data: Payload) => API.patch(`/admin/users/${id}/access`, data);

export const getAbuseRiskUsers = () => API.get('/admin/users/abuse-risk');
export const createAbuseSignal = (data: Payload) => API.post('/admin/users/abuse-signals', data);
export const reviewAbuseSignal = (id: string) => API.patch(`/admin/users/abuse-signals/${id}/review`);
export const massUserAction = (data: Payload) => API.post('/admin/users/mass-action', data);

export const getUniversityVerifications = () => API.get('/admin/verifications');
export const createUniversityVerification = (data: Payload) => API.post('/admin/verifications', data);
export const reviewUniversityVerification = (id: string, action: 'APPROVE' | 'REJECT', note?: string) =>
  API.post(`/admin/verifications/${id}/review`, { action, note });

export const getOperationalAlerts = () => API.get('/admin/alerts');
export const createOperationalAlert = (data: Payload) => API.post('/admin/alerts', data);
export const resolveOperationalAlert = (id: string) => API.patch(`/admin/alerts/${id}/resolve`);

export const getFeatureFlags = () => API.get('/admin/flags');
export const upsertFeatureFlag = (data: Payload) => API.post('/admin/flags', data);
export const deleteFeatureFlag = (key: string) => API.delete(`/admin/flags/${encodeURIComponent(key)}`);
export const getPublicFeatureFlags = () => API.get('/system/flags');

export const getSupportTickets = () => API.get('/admin/support/tickets');
export const getSupportTicketStats = () => API.get('/admin/support/tickets/stats');
export const createAdminSupportTicket = (data: Payload) => API.post('/admin/support/tickets', data);
export const updateSupportTicket = (id: string, data: Payload) => API.patch(`/admin/support/tickets/${id}`, data);
export const createSupportTicket = (data: Payload) => API.post('/system/support/tickets', data);

export default API;

import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) =>
    api.post('/auth/register', data),
  getProfile: () =>
    api.get('/auth/profile'),
  logout: () =>
    api.post('/auth/logout'),
};

// Businesses API
export const businessesApi = {
  getMyBusiness: () =>
    api.get('/businesses/me'),
  updateMyBusiness: (data: any) =>
    api.put('/businesses/me', data),
  getStats: () =>
    api.get('/businesses/me/stats'),
};

// Locations API
export const locationsApi = {
  getAll: () =>
    api.get('/locations'),
  getById: (id: string) =>
    api.get(`/locations/${id}`),
  create: (data: any) =>
    api.post('/locations', data),
  update: (id: string, data: any) =>
    api.patch(`/locations/${id}`, data),
  delete: (id: string) =>
    api.delete(`/locations/${id}`),
  sync: (id: string) =>
    api.post(`/locations/${id}/sync`),
  connect: (id: string, oauthRefreshToken: string) =>
    api.post(`/locations/${id}/connect`, { oauthRefreshToken }),
  disconnect: (id: string) =>
    api.post(`/locations/${id}/disconnect`),
};

// Reviews API
export const reviewsApi = {
  getAll: (params?: any) =>
    api.get('/reviews', { params }),
  getById: (id: string) =>
    api.get(`/reviews/${id}`),
  update: (id: string, data: any) =>
    api.patch(`/reviews/${id}`, data),
  getStats: (params?: any) =>
    api.get('/reviews/stats', { params }),
  bulkUpdateStatus: (reviewIds: string[], status: string) =>
    api.patch('/reviews/bulk/status', { reviewIds, status }),
};

// Replies API
export const repliesApi = {
  getByReview: (reviewId: string) =>
    api.get(`/replies/reviews/${reviewId}`),
  getById: (id: string) =>
    api.get(`/replies/${id}`),
  generate: (reviewId: string, voice?: string) =>
    api.post(`/replies/reviews/${reviewId}/generate`, { voice }),
  update: (id: string, data: any) =>
    api.patch(`/replies/${id}`, data),
  publish: (id: string, finalText: string) =>
    api.post(`/replies/${id}/publish`, { finalText }),
};

// Audit Logs API
export const auditLogsApi = {
  getAll: (params?: any) =>
    api.get('/audit', { params }),
  getById: (id: string) =>
    api.get(`/audit/${id}`),
};


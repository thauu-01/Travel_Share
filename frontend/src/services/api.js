import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/authSlice';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  // Required to send/receive httpOnly refresh token cookie
});

// Request interceptor: attach access token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track whether a refresh is already in progress to avoid duplicate calls
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Response interceptor: auto-refresh on 401 TokenExpiredError
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints (avoid infinite loop)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // If 401 and haven't retried yet — try refreshing
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // If already trying to refresh, queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call /auth/refresh — sends httpOnly cookie automatically
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const { token, user } = res.data.data;

        // Save new access token
        localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));

        // Retry all queued requests
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token expired/missing → dispatch Redux logout cleanly
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  refresh: () => API.post('/auth/refresh'),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
};

export const postAPI = {
  getAll: (params) => API.get('/posts', { params }),
  getById: (id) => API.get(`/posts/${id}`),
  getTrending: () => API.get('/posts/trending'),
  create: (data) => API.post('/posts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/posts/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/posts/${id}`),
  toggleLike: (id) => API.post(`/posts/${id}/like`),
};

export const commentAPI = {
  getByPost: (postId) => API.get(`/posts/${postId}/comments`),
  create: (postId, data) => API.post(`/posts/${postId}/comments`, data),
  delete: (postId, commentId) => API.delete(`/posts/${postId}/comments/${commentId}`),
};

export const placeAPI = {
  getAll: (params) => API.get('/places', { params }),
  getById: (id) => API.get(`/places/${id}`),
  getProvinces: () => API.get('/places/provinces'),
  create: (data) => API.post('/places', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const tripAPI = {
  getAll: () => API.get('/trips'),
  getById: (id) => API.get(`/trips/${id}`),
  create: (data) => API.post('/trips', data),
  update: (id, data) => API.put(`/trips/${id}`, data),
  delete: (id) => API.delete(`/trips/${id}`),
  addDay: (id, data) => API.post(`/trips/${id}/days`, data),
  addPlace: (tripId, dayId, data) => API.post(`/trips/${tripId}/days/${dayId}/places`, data),
};

export const userAPI = {
  getProfile: (id) => API.get(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getUserPosts: (id) => API.get(`/users/${id}/posts`),
  getLikedPosts: () => API.get('/users/liked-posts'),
};

export const categoryAPI = {
  getAll: () => API.get('/categories'),
};

export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
};

export const recommendationAPI = {
  get: () => API.get('/recommendations'),
};

export const adminAPI = {
  getDashboard: () => API.get('/stats/dashboard'),
  // Users
  getUsers: (params) => API.get('/users', { params }),
  banUser: (id) => API.patch(`/users/${id}/ban`),
  updateUserRole: (id, data) => API.patch(`/users/${id}/role`, data),
  // Posts
  getPosts: (params) => API.get('/posts/admin/list', { params }),
  togglePostVisibility: (id) => API.patch(`/posts/${id}/visibility`),
  deletePost: (id) => API.delete(`/posts/${id}/admin`),
  // Comments
  getComments: (params) => API.get('/comments/admin/all', { params }),
  deleteComment: (id) => API.delete(`/comments/admin/${id}`),
  // Places
  getPlaces: (params) => API.get('/places/admin/list', { params }),
  createPlace: (data) => API.post('/places/admin/create', data),
  updatePlace: (id, data) => API.put(`/places/${id}`, data),
  deletePlace: (id) => API.delete(`/places/${id}`),
  // Categories
  getCategories: () => API.get('/categories'),
  createCategory: (data) => API.post('/categories', data),
  updateCategory: (id, data) => API.put(`/categories/${id}`, data),
  deleteCategory: (id) => API.delete(`/categories/${id}`),
  // Reports
  getReports: (params) => API.get('/reports', { params }),
  updateReport: (id, data) => API.patch(`/reports/${id}`, data),
  // Notifications
  broadcastNotification: (data) => API.post('/notifications/broadcast', data),
  // Chats
  getSupportChats: () => API.get('/chat/admin/threads'),
  getChatHistory: (userId) => API.get(`/chat/admin/${userId}`),
  sendAdminMessage: (userId, data) => API.post(`/chat/admin/${userId}/send`, data),
};

export const chatAPI = {
  getHistory: () => API.get('/chat/history'),
  sendMessage: (data) => API.post('/chat/send', data),
};

export const reportAPI = {
  create: (data) => API.post('/reports', data),
};

export default API;

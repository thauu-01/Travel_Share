import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
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

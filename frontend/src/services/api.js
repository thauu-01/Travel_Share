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
  update: (id, data) => API.put(`/posts/${id}`, data),
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

export default API;

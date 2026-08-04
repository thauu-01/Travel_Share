import { createSlice } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

const user = JSON.parse(localStorage.getItem('user') || 'null');
const token = localStorage.getItem('token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user,
    token: token,
    isAuthenticated: !!token,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Xóa refresh token cookie phía server
      authAPI.logout().catch(() => {});
      // Phát sự kiện để App.jsx chuyển về /login
      window.dispatchEvent(new CustomEvent('auth:logout'));
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    // Cập nhật access token mới (sau khi refresh)
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
  },
});

export const { loginSuccess, logout, updateUser, setToken } = authSlice.actions;
export default authSlice.reducer;

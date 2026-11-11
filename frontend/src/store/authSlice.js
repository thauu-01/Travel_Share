import { useAuthStore } from './useAuthStore';

export const loginSuccess = (payload) => useAuthStore.getState().loginSuccess(payload);
export const logout = () => useAuthStore.getState().logout();
export const updateUser = (payload) => useAuthStore.getState().updateUser(payload);
export const setToken = (payload) => useAuthStore.getState().setToken(payload);

export default useAuthStore;

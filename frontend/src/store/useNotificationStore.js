import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications = [], unreadCount = 0) => {
    set({ notifications, unreadCount });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  markAllRead: () => {
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map(n => ({ ...n, is_read: true }))
    }));
  },

  markAsRead: (notificationId) => {
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
      notifications: state.notifications.map(n =>
        (n._id === notificationId || n.id === notificationId) ? { ...n, is_read: true } : n
      )
    }));
  }
}));

export default useNotificationStore;

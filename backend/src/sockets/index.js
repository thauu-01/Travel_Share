import { initNotificationEvents } from '../events/notification.event.js';

const adminSockets = new Set();

export function setupSocket(io) {
  io.adminSockets = adminSockets;

  initNotificationEvents(io);

  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('leave', (userId) => {
      socket.leave(`user_${userId}`);
    });

    socket.on('admin_join_support', () => {
      socket.join('admin_support');
      adminSockets.add(socket.id);
    });

    socket.on('admin_leave_support', () => {
      socket.leave('admin_support');
      adminSockets.delete(socket.id);
    });

    socket.on('disconnect', () => {
      if (adminSockets.has(socket.id)) {
        adminSockets.delete(socket.id);
      }
    });
  });
}

export default setupSocket;

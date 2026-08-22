// Track admin socket IDs that are currently online (in support page)
const adminSockets = new Set();

module.exports = (io) => {
  // Expose adminSockets so other modules can check if admin is online
  io.adminSockets = adminSockets;

  io.on('connection', (socket) => {
    console.log('📡 User connected:', socket.id);

    // User joins their personal notification room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room user_${userId}`);
    });

    // User leaves room
    socket.on('leave', (userId) => {
      socket.leave(`user_${userId}`);
    });

    // Admin joins the support dashboard
    socket.on('admin_join_support', () => {
      socket.join('admin_support');
      adminSockets.add(socket.id);
      console.log(`🛡️ Admin joined support room. Online admins: ${adminSockets.size}`);
    });

    // Admin leaves the support dashboard
    socket.on('admin_leave_support', () => {
      socket.leave('admin_support');
      adminSockets.delete(socket.id);
      console.log(`🛡️ Admin left support room. Online admins: ${adminSockets.size}`);
    });

    socket.on('disconnect', () => {
      // If this was an admin socket, remove from tracking
      if (adminSockets.has(socket.id)) {
        adminSockets.delete(socket.id);
        console.log(`🛡️ Admin disconnected. Online admins: ${adminSockets.size}`);
      }
      console.log('📡 User disconnected:', socket.id);
    });
  });
};

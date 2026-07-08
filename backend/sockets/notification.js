module.exports = (io) => {
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

    socket.on('disconnect', () => {
      console.log('📡 User disconnected:', socket.id);
    });
  });
};

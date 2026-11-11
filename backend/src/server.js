import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import setupSocket from './sockets/index.js';

const server = http.createServer(app);

// Khởi tạo Socket.IO
export const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

setupSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   TravelShare API Server - Port ${PORT}          ║
  ║   URL: http://localhost:${PORT}                  ║
  ║   Architecture: Layered Clean Architecture    ║
  ║   Modules: Native ES Modules (import/export)  ║
  ║   Socket.IO: Enabled                          ║
  ╚═══════════════════════════════════════════════╝`);
  });
}

export { app, server };
export default server;

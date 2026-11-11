import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

// Khởi tạo kết nối DB & Models
import './models/index.js';

import apiRoutes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.middleware.js';
import notFoundHandler from './middlewares/notFound.middleware.js';

const app = express();

// Middlewares cơ bản
app.use(express.json({ charset: 'utf8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf8' }));
app.use(cookieParser());

// Đảm bảo UTF-8 header
app.use((req, res, next) => {
  res.set('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Cấu hình CORS
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Gắn toàn bộ API endpoints
app.use('/api', apiRoutes);

// Health check root
app.get('/', (req, res) => {
  res.json({
    message: 'TravelShare API Server',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date()
  });
});

// Xử lý 404 & lỗi tập trung
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

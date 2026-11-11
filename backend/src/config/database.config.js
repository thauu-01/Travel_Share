import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tải đúng file .env dù chạy từ thư mục gốc hay thư mục backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

// Hỗ trợ DNS phân giải cho MongoDB Atlas SRV trên Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore
}

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelshare';

// Set mongoose options
mongoose.set('strictQuery', false);

export const connectDB = async () => {
  const isAtlas = mongoURI.includes('mongodb+srv');
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // Giảm timeout xuống 5s để fallback nhanh hơn
    });
    console.log(isAtlas ? '✓ Kết nối MongoDB Cloud Atlas thành công!' : '✓ Kết nối MongoDB thành công!');
  } catch (err) {
    if (isAtlas) {
      console.warn('⚠️ Lỗi kết nối MongoDB Atlas:', err.message);
      console.log('🔄 Đang tự động chuyển sang kết nối MongoDB Local (127.0.0.1:27017/travelshare)...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/travelshare', {
          serverSelectionTimeoutMS: 3000
        });
        console.log('✓ Kết nối MongoDB Local dự phòng thành công! Dữ liệu hoạt động bình thường.');
      } catch (localErr) {
        console.error('✗ Không thể kết nối MongoDB (cả Atlas lẫn Local):', localErr.message);
        process.exit(1);
      }
    } else {
      console.error('✗ Lỗi kết nối MongoDB:', err.message);
      process.exit(1);
    }
  }
};

// Khởi chạy kết nối
connectDB();

export default mongoose;

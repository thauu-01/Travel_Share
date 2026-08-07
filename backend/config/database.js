const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// Fix Windows Node.js querySrv ECONNREFUSED for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if fails
}

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelshare';

// Set mongoose options
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✓ Kết nối MongoDB Cloud Atlas thành công!');
  } catch (err) {
    console.error('✗ Lỗi kết nối MongoDB Atlas:', err.message);
    if (mongoURI.includes('mongodb+srv')) {
      console.log('🔄 Đang chuyển sang kết nối MongoDB Local dự phòng...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/travelshare');
        console.log('✓ Kết nối MongoDB Local dự phòng thành công!');
      } catch (localErr) {
        console.error('✗ Lỗi kết nối MongoDB Local:', localErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

// Auto-run connection
connectDB();

module.exports = mongoose;

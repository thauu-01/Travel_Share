const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelshare';

// Set mongoose options
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✓ Kết nối MongoDB thành công');
  } catch (err) {
    console.error('✗ Lỗi kết nối MongoDB:', err);
    process.exit(1);
  }
};

// Auto-run connection
connectDB();

module.exports = mongoose;

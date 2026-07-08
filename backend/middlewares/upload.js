const { upload } = require('../config/cloudinary');

// Upload single image
const uploadSingle = upload.single('image');

// Upload multiple images (max 5)
const uploadMultiple = upload.array('images', 5);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File quá lớn. Giới hạn 10MB.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Quá nhiều file. Giới hạn 5 ảnh.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Lỗi upload: ' + err.message
    });
  }
  next();
};

module.exports = { uploadSingle, uploadMultiple, handleUploadError };

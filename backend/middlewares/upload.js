const { uploadAvatar, uploadPost } = require('../config/cloudinary');

// Avatar (single image for user profile) -> travelshare/avatars/
const uploadSingle = uploadAvatar.single('image');

// Post & place images (multiple, max 5) -> travelshare/posts/{id}/
const uploadMultiple = uploadPost.array('images', 5);

// Place cover (single) -> also goes to travelshare/posts/temp/ or posts/{id}/
const uploadPlaceSingle = uploadPost.single('image');

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

module.exports = { uploadSingle, uploadMultiple, uploadPlaceSingle, handleUploadError };

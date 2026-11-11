import { uploadAvatar, uploadPost } from '../config/cloudinary.config.js';
import ApiResponse from '../utils/apiResponse.js';

export const uploadSingle = uploadAvatar.single('image');
export const uploadMultiple = uploadPost.array('images', 5);
export const uploadPlaceSingle = uploadPost.single('image');

export const handleUploadError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, 'File quá lớn. Giới hạn 10MB.', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiResponse.error(res, 'Quá nhiều file. Giới hạn 5 ảnh.', 400);
    }
    return ApiResponse.error(res, 'Lỗi upload: ' + err.message, 400);
  }
  next();
};

export default {
  uploadSingle,
  uploadMultiple,
  uploadPlaceSingle,
  handleUploadError
};

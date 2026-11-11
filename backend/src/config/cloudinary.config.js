import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage cho ảnh đại diện user (avatar)
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'travelshare/avatars',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]
  }
});

// Storage cho bài viết và địa điểm du lịch
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const postId = req.params?.id || req.body?.post_id || 'temp';
    return {
      folder: `travelshare/posts/${postId}`,
      transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
    };
  }
});

export const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
export const uploadPost = multer({ storage: postStorage, limits: { fileSize: 10 * 1024 * 1024 } });

export { cloudinary };
export default { cloudinary, uploadAvatar, uploadPost };
